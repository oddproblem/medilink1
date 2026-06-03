// class Report {
//   final String id;
//   final String content;

//   Report({required this.id, required this.content});

//   factory Report.fromJson(Map<String, dynamic> json) => Report(
//         id: json["_id"],
//         content: json["content"],
//       );

//   Map<String, dynamic> toJson() => {"id": id, "content": content};
// }
class Report {
  final String id;
  final String content;

  Report({required this.id, required this.content});

  factory Report.fromJson(Map<String, dynamic> json) => Report(
        id: json["_id"]?.toString() ?? '',
        content: json["content"]?.toString() ?? json["message"]?.toString() ?? '',
      );

  Map<String, dynamic> toJson() => {"id": id, "content": content};
}

