const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const tempDir = path.join(__dirname, '..', 'tmp');
const maxUploadBytes = 15 * 1024 * 1024;

function ensureTempDir() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}

function parseContentDisposition(value) {
  const result = {};
  for (const part of value.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || rawValue.length === 0) continue;
    result[rawKey] = rawValue.join('=').replace(/^"|"$/g, '');
  }
  return result;
}

function safeExtension(filename, contentType) {
  const ext = path.extname(filename || '').toLowerCase();
  if (/^\.[a-z0-9]{1,8}$/.test(ext)) return ext;

  if (contentType === 'image/png') return '.png';
  if (contentType === 'image/jpeg') return '.jpg';
  if (contentType === 'application/pdf') return '.pdf';
  return '.bin';
}

function parseOptionalOcrUpload(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    next();
    return;
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundaryValue = boundaryMatch && (boundaryMatch[1] || boundaryMatch[2]);
  if (!boundaryValue) {
    res.status(400).json({ message: 'Missing multipart boundary.' });
    return;
  }

  const chunks = [];
  let totalBytes = 0;
  let aborted = false;

  req.on('data', (chunk) => {
    totalBytes += chunk.length;
    if (totalBytes > maxUploadBytes) {
      aborted = true;
      res.status(413).json({ message: 'Prescription upload is too large.' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (aborted) return;

    try {
      ensureTempDir();
      const body = Buffer.concat(chunks);
      const boundary = Buffer.from(`--${boundaryValue}`);
      const fields = {};
      let uploadedFile = null;
      let offset = body.indexOf(boundary);

      while (offset !== -1) {
        let partStart = offset + boundary.length;
        if (body[partStart] === 45 && body[partStart + 1] === 45) break;
        if (body[partStart] === 13 && body[partStart + 1] === 10) {
          partStart += 2;
        }

        const nextBoundary = body.indexOf(boundary, partStart);
        if (nextBoundary === -1) break;

        let partEnd = nextBoundary;
        if (body[partEnd - 2] === 13 && body[partEnd - 1] === 10) {
          partEnd -= 2;
        }

        const part = body.subarray(partStart, partEnd);
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd !== -1) {
          const headerText = part.subarray(0, headerEnd).toString('utf8');
          const content = part.subarray(headerEnd + 4);
          const headers = {};

          for (const line of headerText.split('\r\n')) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;
            headers[line.slice(0, colonIndex).toLowerCase()] = line
              .slice(colonIndex + 1)
              .trim();
          }

          const disposition = parseContentDisposition(
            headers['content-disposition'] || ''
          );
          const fieldName = disposition.name;

          if (fieldName && disposition.filename) {
            const ext = safeExtension(
              disposition.filename,
              headers['content-type']
            );
            const filename = `${crypto.randomUUID()}${ext}`;
            const filePath = path.join(tempDir, filename);
            fs.writeFileSync(filePath, content);
            uploadedFile = {
              filename,
              path: filePath,
              originalname: disposition.filename,
              mimetype: headers['content-type'],
            };
          } else if (fieldName) {
            fields[fieldName] = content.toString('utf8');
          }
        }

        offset = nextBoundary;
      }

      req.body = fields;
      if (uploadedFile) req.file = uploadedFile;
      next();
    } catch (error) {
      next(error);
    }
  });

  req.on('error', next);
}

module.exports = { parseOptionalOcrUpload };
