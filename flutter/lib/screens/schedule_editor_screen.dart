import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:provider/provider.dart';
import 'package:siargao_trading_road/models/schedule_exception.dart';
import 'package:siargao_trading_road/services/schedule_service.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:intl/intl.dart';

class ScheduleEditorScreen extends StatefulWidget {
  const ScheduleEditorScreen({super.key});

  @override
  State<ScheduleEditorScreen> createState() => _ScheduleEditorScreenState();
}

class _ScheduleEditorScreenState extends State<ScheduleEditorScreen> {
  List<ScheduleException> _exceptions = [];
  Set<DateTime> _closedDates = {};
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.month;
  bool _loading = false;
  ScheduleException? _selectedException;

  @override
  void initState() {
    super.initState();
    _loadScheduleExceptions();
  }

  Future<void> _loadScheduleExceptions() async {
    setState(() {
      _loading = true;
    });

    try {
      final exceptions = await ScheduleService.getScheduleExceptions();
      setState(() {
        _exceptions = exceptions;
        _closedDates = exceptions.where((e) => e.isClosed).map((e) => DateTime(e.date.year, e.date.month, e.date.day)).toSet();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load schedule: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  bool _isDateClosed(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    if (_closedDates.contains(dateOnly)) {
      return true;
    }
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user?.closedDaysOfWeek != null && user!.closedDaysOfWeek!.isNotEmpty) {
      final closedDays = user.closedDaysOfWeek!.split(',').map((d) => int.parse(d.trim())).toSet();
      final weekday = date.weekday;
      final dayOfWeek = weekday == 7 ? 0 : weekday;
      if (closedDays.contains(dayOfWeek)) {
        return true;
      }
    }
    
    return false;
  }

  Future<void> _toggleDateClosed(DateTime date) async {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final isCurrentlyClosed = _isDateClosed(date);
    
    setState(() {
      _loading = true;
    });

    try {
      if (isCurrentlyClosed) {
        final exception = _exceptions.firstWhere(
          (e) => DateTime(e.date.year, e.date.month, e.date.day) == dateOnly,
        );
        await ScheduleService.deleteScheduleException(exception.id);
        setState(() {
          _closedDates.remove(dateOnly);
          _exceptions.removeWhere((e) => e.id == exception.id);
        });
      } else {
        final exception = await ScheduleService.createScheduleException(
          date: dateOnly,
          isClosed: true,
        );
        setState(() {
          _closedDates.add(dateOnly);
          _exceptions.add(exception);
        });
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isCurrentlyClosed ? 'Date opened' : 'Date closed'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update date: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }


  void _showDateDetails(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final exception = _exceptions.firstWhere(
      (e) => DateTime(e.date.year, e.date.month, e.date.day) == dateOnly,
      orElse: () => ScheduleException(
        id: 0,
        userId: 0,
        date: dateOnly,
        isClosed: false,
        notes: '',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    );

    setState(() {
      _selectedException = exception;
    });

    showModalBottomSheet(
      context: context,
      builder: (context) => _DateDetailsSheet(
        exception: exception,
        onUpdate: () => _loadScheduleExceptions(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Schedule'),
      ),
      body: _loading && _exceptions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: TableCalendar(
                    firstDay: DateTime.now().subtract(const Duration(days: 365)),
                    lastDay: DateTime.now().add(const Duration(days: 365)),
                    focusedDay: _focusedDay,
                    selectedDayPredicate: (day) {
                      return day.year == _selectedDay.year &&
                             day.month == _selectedDay.month &&
                             day.day == _selectedDay.day;
                    },
                    calendarFormat: _calendarFormat,
                    onFormatChanged: (format) {
                      setState(() {
                        _calendarFormat = format;
                      });
                    },
                    onDaySelected: (selectedDay, focusedDay) {
                      setState(() {
                        _selectedDay = selectedDay;
                        _focusedDay = focusedDay;
                      });
                      _showDateDetails(selectedDay);
                    },
                    onPageChanged: (focusedDay) {
                      _focusedDay = focusedDay;
                    },
                    eventLoader: (day) {
                      final dateOnly = DateTime(day.year, day.month, day.day);
                      final authProvider = Provider.of<AuthProvider>(context, listen: false);
                      final user = authProvider.user;
                      
                      if (_closedDates.contains(dateOnly)) {
                        return ['closed'];
                      }
                      
                      if (user?.closedDaysOfWeek != null && user!.closedDaysOfWeek!.isNotEmpty) {
                        final closedDays = user.closedDaysOfWeek!.split(',').map((d) => int.parse(d.trim())).toSet();
                        final weekday = day.weekday;
                        final dayOfWeek = weekday == 7 ? 0 : weekday;
                        if (closedDays.contains(dayOfWeek)) {
                          return ['closed'];
                        }
                      }
                      
                      return [];
                    },
                    calendarStyle: CalendarStyle(
                      selectedDecoration: BoxDecoration(
                        color: Theme.of(context).primaryColor,
                        shape: BoxShape.circle,
                      ),
                      todayDecoration: BoxDecoration(
                        color: Colors.blue.shade100,
                        shape: BoxShape.circle,
                      ),
                      markerDecoration: BoxDecoration(
                        color: Colors.red.shade300,
                        shape: BoxShape.circle,
                      ),
                    ),
                    headerStyle: const HeaderStyle(
                      formatButtonVisible: true,
                      titleCentered: true,
                    ),
                  ),
                ),
                if (_selectedException != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      border: Border(top: BorderSide(color: Colors.grey.shade300)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DateFormat('EEEE, MMMM d, yyyy').format(_selectedDay),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text(
                              _selectedException!.isClosed ? 'Closed' : 'Open',
                              style: TextStyle(
                                color: _selectedException!.isClosed ? Colors.red : Colors.green,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 16),
                            if (!_selectedException!.isClosed && _selectedException!.openingTime != null)
                              Expanded(
                                child: Text('${_selectedException!.openingTime} - ${_selectedException!.closingTime ?? ""}'),
                              ),
                          ],
                        ),
                        if (_selectedException!.notes.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(_selectedException!.notes),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () => _toggleDateClosed(_selectedDay),
                              child: Text(
                                _selectedException!.isClosed ? 'Open Date' : 'Close Date',
                                style: TextStyle(
                                  color: _selectedException!.isClosed ? Colors.green : Colors.red,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }
}

class _DateDetailsSheet extends StatefulWidget {
  final ScheduleException exception;
  final VoidCallback onUpdate;

  const _DateDetailsSheet({
    required this.exception,
    required this.onUpdate,
  });

  @override
  State<_DateDetailsSheet> createState() => _DateDetailsSheetState();
}

class _DateDetailsSheetState extends State<_DateDetailsSheet> {
  late bool _isClosed;
  late String? _openingTime;
  late String? _closingTime;
  late String _notes;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _isClosed = widget.exception.isClosed;
    _openingTime = widget.exception.openingTime;
    _closingTime = widget.exception.closingTime;
    _notes = widget.exception.notes;
  }

  Future<void> _selectTime(BuildContext context, bool isOpening) async {
    final now = DateTime.now();
    final initialTime = TimeOfDay.fromDateTime(now);
    
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );

    if (picked != null) {
      final formattedTime = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      setState(() {
        if (isOpening) {
          _openingTime = formattedTime;
        } else {
          _closingTime = formattedTime;
        }
      });
    }
  }

  Future<void> _save() async {
    if (widget.exception.id == 0) {
      await _create();
    } else {
      await _update();
    }
  }

  Future<void> _create() async {
    setState(() {
      _loading = true;
    });

    try {
      await ScheduleService.createScheduleException(
        date: widget.exception.date,
        isClosed: _isClosed,
        openingTime: _openingTime,
        closingTime: _closingTime,
        notes: _notes,
      );
      if (mounted) {
        Navigator.pop(context);
        widget.onUpdate();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Schedule updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _update() async {
    setState(() {
      _loading = true;
    });

    try {
      await ScheduleService.updateScheduleException(
        id: widget.exception.id,
        isClosed: _isClosed,
        openingTime: _openingTime,
        closingTime: _closingTime,
        notes: _notes,
      );
      if (mounted) {
        Navigator.pop(context);
        widget.onUpdate();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Schedule updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            DateFormat('EEEE, MMMM d, yyyy').format(widget.exception.date),
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('Closed'),
            value: _isClosed,
            onChanged: (value) {
              setState(() {
                _isClosed = value;
              });
            },
          ),
          if (!_isClosed) ...[
            const SizedBox(height: 8),
            InkWell(
              onTap: () => _selectTime(context, true),
              child: TextField(
                controller: TextEditingController(text: _openingTime ?? ''),
                decoration: const InputDecoration(
                  labelText: 'Opening Time',
                  suffixIcon: Icon(Icons.access_time),
                ),
                enabled: false,
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: () => _selectTime(context, false),
              child: TextField(
                controller: TextEditingController(text: _closingTime ?? ''),
                decoration: const InputDecoration(
                  labelText: 'Closing Time',
                  suffixIcon: Icon(Icons.access_time),
                ),
                enabled: false,
              ),
            ),
          ],
          const SizedBox(height: 8),
          TextField(
            controller: TextEditingController(text: _notes),
            onChanged: (value) {
              _notes = value;
            },
            decoration: const InputDecoration(
              labelText: 'Notes',
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loading ? null : _save,
            child: _loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
    );
  }
}
