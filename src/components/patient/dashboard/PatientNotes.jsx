import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit, Save, XCircle, ArchiveRestore } from 'lucide-react';

const listItemVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100 } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
};

export default function PatientNotes({
    t,
    patientNote,
    setPatientNote,
    activeNotes,
    archivedNotes,
    showArchived,
    setShowArchived,
    editingNoteId,
    setEditingNoteId,
    editingText,
    setEditingText,
    handleNoteSubmit,
    handleUpdateNote,
    handleDeleteNote,
    handleRestoreNote,
    saveNote,
}) {
    return (
        <motion.div
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 shadow-lg rounded-2xl p-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16,185,129,0.6)" }}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('patientNotes')}
                </h3>
                <label className="flex items-center text-sm cursor-pointer text-gray-600 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={() => setShowArchived(!showArchived)}
                        className="mr-2 h-4 w-4 rounded"
                    />
                    {t('showArchived')}
                </label>
            </div>

            <ul className="space-y-2 mb-4">
                <AnimatePresence mode="popLayout">
                    {activeNotes.length > 0 ? (
                        activeNotes.map((note) => (
                            <motion.li
                                key={note._id}
                                className="flex justify-between items-center bg-gray-100/50 dark:bg-gray-700/50 p-2 rounded-md group"
                                variants={listItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                layout
                            >
                                {editingNoteId === note._id ? (
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        className="flex-grow bg-transparent border-b border-indigo-500 focus:outline-none text-gray-800 dark:text-white"
                                    />
                                ) : (
                                    <span className="text-gray-800 dark:text-gray-200">- {note.translatedText || note.noteText}</span>
                                )}

                                <div className=" flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingNoteId === note._id ? (
                                        <>
                                            <button onClick={() => handleUpdateNote(note._id)} className="edit-note text-green-500 hover:text-green-400" title={t('save')}>
                                                <Save size={16} />
                                            </button>
                                            <button onClick={() => { setEditingNoteId(null); setEditingText(''); }} className=" text-gray-500 hover:text-gray-400" title={t('cancel')}>
                                                <XCircle size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditingNoteId(note._id); setEditingText(note.noteText); }} className="edit-note-btn text-blue-500 hover:text-blue-400" title={t('edit')}>
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteNote(note._id)} className="delete-note-btn text-red-500 hover:text-red-400" title={t('delete')}>
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.li>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">{t('noNotesFound')}</p>
                    )}
                </AnimatePresence>
            </ul>

            {showArchived && archivedNotes.length > 0 && (
                <>
                    <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400 mt-6 mb-2">
                        {t('archivedNotes')}
                    </h4>
                    <ul className="space-y-2 mb-4">
                        <AnimatePresence mode="popLayout">
                            {archivedNotes.map((note) => (
                                <motion.li key={note._id} className="flex justify-between items-center bg-gray-200/50 dark:bg-gray-800/50 p-2 rounded-md opacity-60"
                                    variants={listItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    layout
                                >
                                    <span className="line-through text-gray-800 dark:text-gray-200">- {note.translatedText || note.noteText}</span>
                                    <button onClick={() => handleRestoreNote(note._id)} className="text-green-500 hover:text-green-400" title={t('restoreNote')}>
                                        <ArchiveRestore size={16} />
                                    </button>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                </>
            )}

            <textarea
                placeholder={t('writeNotePlaceholder')}
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                onKeyDown={handleNoteSubmit}
                className="w-full h-32 px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            ></textarea>

            <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={saveNote}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
                {t('saveNote')}
            </motion.button>
        </motion.div>
    );
}