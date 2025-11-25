/// Modelo de dados: Critérios de Aceitação
class AcceptanceCriteria {
  final double minValue;
  final double minValuePerKm;
  final double maxKm;
  final double? peakHourMinValuePerKm;
  final double dailyGoal;
  final double todayEarnings;
  final int todayTrips;
  final double todayKm;
  final double fuelConsumption;
  final double avgFuelPrice;

  AcceptanceCriteria({
    required this.minValue,
    required this.minValuePerKm,
    required this.maxKm,
    this.peakHourMinValuePerKm,
    required this.dailyGoal,
    required this.todayEarnings,
    required this.todayTrips,
    required this.todayKm,
    required this.fuelConsumption,
    required this.avgFuelPrice,
  });

  factory AcceptanceCriteria.fromJson(Map<String, dynamic> json) {
    return AcceptanceCriteria(
      minValue: (json['minValue'] as num).toDouble(),
      minValuePerKm: (json['minValuePerKm'] as num).toDouble(),
      maxKm: (json['maxKm'] as num).toDouble(),
      peakHourMinValuePerKm: json['peakHourMinValuePerKm'] != null
          ? (json['peakHourMinValuePerKm'] as num).toDouble()
          : null,
      dailyGoal: (json['dailyGoal'] as num).toDouble(),
      todayEarnings: (json['todayEarnings'] as num).toDouble(),
      todayTrips: json['todayTrips'] as int,
      todayKm: (json['todayKm'] as num).toDouble(),
      fuelConsumption: (json['fuelConsumption'] as num).toDouble(),
      avgFuelPrice: (json['avgFuelPrice'] as num).toDouble(),
    );
  }

  double get progressPercent =>
      dailyGoal > 0 ? (todayEarnings / dailyGoal) * 100 : 0;

  double get remainingToGoal =>
      dailyGoal > todayEarnings ? dailyGoal - todayEarnings : 0;
}

