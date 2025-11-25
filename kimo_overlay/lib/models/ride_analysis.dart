/// Modelo de dados: Análise de Corrida
class RideAnalysis {
  final String decision; // 'accept', 'reject', 'neutral'
  final double valuePerKm;
  final double profitPerKm;
  final String reason;
  final AnalysisDetails details;

  RideAnalysis({
    required this.decision,
    required this.valuePerKm,
    required this.profitPerKm,
    required this.reason,
    required this.details,
  });

  factory RideAnalysis.fromJson(Map<String, dynamic> json) {
    return RideAnalysis(
      decision: json['decision'] as String,
      valuePerKm: (json['valuePerKm'] as num).toDouble(),
      profitPerKm: (json['profitPerKm'] as num).toDouble(),
      reason: json['reason'] as String,
      details: AnalysisDetails.fromJson(json['details'] as Map<String, dynamic>),
    );
  }

  bool get shouldAccept => decision == 'accept';
  bool get shouldReject => decision == 'reject';
  bool get isNeutral => decision == 'neutral';
}

class AnalysisDetails {
  final double value;
  final double km;
  final double estimatedCost;
  final double estimatedProfit;
  final double fuelCost;
  final double maintenanceCost;

  AnalysisDetails({
    required this.value,
    required this.km,
    required this.estimatedCost,
    required this.estimatedProfit,
    required this.fuelCost,
    required this.maintenanceCost,
  });

  factory AnalysisDetails.fromJson(Map<String, dynamic> json) {
    return AnalysisDetails(
      value: (json['value'] as num).toDouble(),
      km: (json['km'] as num).toDouble(),
      estimatedCost: (json['estimatedCost'] as num).toDouble(),
      estimatedProfit: (json['estimatedProfit'] as num).toDouble(),
      fuelCost: (json['fuelCost'] as num).toDouble(),
      maintenanceCost: (json['maintenanceCost'] as num).toDouble(),
    );
  }
}

