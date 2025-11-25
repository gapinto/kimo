import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/notification_service.dart';
import '../services/overlay_service.dart';
import '../models/user.dart';
import '../models/criteria.dart';
import '../models/stats.dart';
import 'login_screen.dart';

/// Tela Principal (Home)
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  late NotificationService _notificationService;

  User? _user;
  AcceptanceCriteria? _criteria;
  Stats? _stats;
  bool _isLoading = true;
  bool _serviceEnabled = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _notificationService = NotificationService(_apiService, _storageService);
    _loadData();
  }

  @override
  void dispose() {
    _notificationService.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Buscar usuário
      final user = await _storageService.getUser();
      if (user == null) {
        _logout();
        return;
      }

      // Buscar critérios e stats
      final criteria = await _apiService.getCriteria(user.userId);
      final stats = await _apiService.getStats(user.userId);
      final serviceEnabled = await _storageService.isServiceEnabled();

      setState(() {
        _user = user;
        _criteria = criteria;
        _stats = stats;
        _serviceEnabled = serviceEnabled;
        _isLoading = false;
      });

      // Iniciar serviço se estava ativo
      if (serviceEnabled) {
        await _startService();
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _startService() async {
    try {
      // Verificar permissões
      final hasOverlay = await OverlayService.canShowOverlay();
      if (!hasOverlay) {
        final granted = await OverlayService.requestPermission();
        if (!granted) {
          _showError('Permissão de overlay necessária');
          return;
        }
      }

      final hasNotification = await _notificationService.hasPermission();
      if (!hasNotification) {
        final granted = await _notificationService.requestPermission();
        if (!granted) {
          _showError('Permissão de notificações necessária');
          return;
        }
      }

      // Iniciar escuta
      await _notificationService.startListening();
      await _storageService.setServiceEnabled(true);

      setState(() {
        _serviceEnabled = true;
      });

      _showSuccess('Serviço ativado!');
    } catch (e) {
      _showError('Erro ao iniciar serviço: $e');
    }
  }

  Future<void> _stopService() async {
    try {
      await _notificationService.stopListening();
      await _storageService.setServiceEnabled(false);

      setState(() {
        _serviceEnabled = false;
      });

      _showSuccess('Serviço desativado');
    } catch (e) {
      _showError('Erro ao parar serviço: $e');
    }
  }

  Future<void> _testOverlay() async {
    try {
      await _notificationService.testOverlay(value: 45, km: 12);
    } catch (e) {
      _showError('Erro ao testar: $e');
    }
  }

  void _logout() {
    _storageService.clearAll();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(_errorMessage!),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadData,
                child: const Text('Tentar Novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('KIMO Overlay'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Card de Status do Serviço
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Serviço de Overlay',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Switch(
                            value: _serviceEnabled,
                            onChanged: (value) {
                              if (value) {
                                _startService();
                              } else {
                                _stopService();
                              }
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _serviceEnabled
                            ? '🟢 Ativo - Detectando corridas automaticamente'
                            : '🔴 Inativo - Ative para receber alertas',
                        style: TextStyle(
                          color: _serviceEnabled ? Colors.green : Colors.red,
                        ),
                      ),
                      if (_serviceEnabled) ...[
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _testOverlay,
                          child: const Text('Testar Overlay'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Card de Progresso Diário
              if (_criteria != null)
                Card(
                  color: Colors.blue[50],
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '🎯 Meta Diária',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        LinearProgressIndicator(
                          value: _criteria!.progressPercent / 100,
                          backgroundColor: Colors.grey[300],
                          minHeight: 10,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'R\$ ${_criteria!.todayEarnings.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Meta: R\$ ${_criteria!.dailyGoal.toStringAsFixed(2)}',
                              style: const TextStyle(fontSize: 14),
                            ),
                          ],
                        ),
                        if (_criteria!.remainingToGoal > 0) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Faltam R\$ ${_criteria!.remainingToGoal.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),

              // Card de Estatísticas de Hoje
              if (_stats != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '📊 Hoje',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStat(
                              '💰',
                              'R\$ ${_stats!.today.earnings.toStringAsFixed(0)}',
                              'Ganhos',
                            ),
                            _buildStat(
                              '🚗',
                              '${_stats!.today.trips}',
                              'Corridas',
                            ),
                            _buildStat(
                              '📍',
                              '${_stats!.today.km.toStringAsFixed(0)} km',
                              'Distância',
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStat(
                              '💵',
                              'R\$ ${_stats!.today.avgPerKm.toStringAsFixed(2)}',
                              'Por KM',
                            ),
                            _buildStat(
                              '🎯',
                              'R\$ ${_stats!.today.profit.toStringAsFixed(0)}',
                              'Lucro',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),

              // Card de Estatísticas da Semana
              if (_stats != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '📅 Últimos 7 dias',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStat(
                              '💰',
                              'R\$ ${_stats!.week.earnings.toStringAsFixed(0)}',
                              'Total',
                            ),
                            _buildStat(
                              '🚗',
                              '${_stats!.week.trips}',
                              'Corridas',
                            ),
                            _buildStat(
                              '📊',
                              'R\$ ${_stats!.week.avgPerKm.toStringAsFixed(2)}/km',
                              'Média',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),

              // Card de Critérios
              if (_criteria != null)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '⚙️ Seus Critérios',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildCriteriaRow(
                          'Valor mínimo',
                          'R\$ ${_criteria!.minValue.toStringAsFixed(0)}',
                        ),
                        _buildCriteriaRow(
                          'Mínimo por KM',
                          'R\$ ${_criteria!.minValuePerKm.toStringAsFixed(2)}/km',
                        ),
                        _buildCriteriaRow(
                          'Distância máxima',
                          '${_criteria!.maxKm.toStringAsFixed(0)} km',
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Para alterar critérios, use o comando "criterio" no WhatsApp',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStat(String emoji, String value, String label) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildCriteriaRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

