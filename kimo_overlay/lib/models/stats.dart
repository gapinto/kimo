/// Modelo de dados: Estatísticas
class Stats {
  final DayStats today;
  final WeekStats week;

  Stats({
    required this.today,
    required this.week,
  });

  factory Stats.fromJson(Map<String, dynamic> json) {
    return Stats(
      today: DayStats.fromJson(json['today'] as Map<String, dynamic>),
      week: WeekStats.fromJson(json['week'] as Map<String, dynamic>),
    );
  }
}

class DayStats {
  final double earnings;
  final double expenses;
  final double profit;
  final double km;
  final int trips;

  DayStats({
    required this.earnings,
    required this.expenses,
    required this.profit,
    required this.km,
    required this.trips,
  });

  factory DayStats.fromJson(Map<String, dynamic> json) {
    return DayStats(
      earnings: (json['earnings'] as num).toDouble(),
      expenses: (json['expenses'] as num).toDouble(),
      profit: (json['profit'] as num).toDouble(),
      km: (json['km'] as num).toDouble(),
      trips: json['trips'] as int,
    );
  }

  double get avgPerTrip => trips > 0 ? earnings / trips : 0;
  double get avgPerKm => km > 0 ? earnings / km : 0;
}

class WeekStats {
  final double earnings;
  final double km;
  final int trips;
  final double avgPerTrip;
  final double avgPerKm;

  WeekStats({
    required this.earnings,
    required this.km,
    required this.trips,
    required this.avgPerTrip,
    required this.avgPerKm,
  });

  factory WeekStats.fromJson(Map<String, dynamic> json) {
    return WeekStats(
      earnings: (json['earnings'] as num).toDouble(),
      km: (json['km'] as num).toDouble(),
      trips: json['trips'] as int,
      avgPerTrip: (json['avgPerTrip'] as num).toDouble(),
      avgPerKm: (json['avgPerKm'] as num).toDouble(),
    );
  }
}

