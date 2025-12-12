import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:provider/provider.dart';
import 'package:siargao_trading_road/models/schedule_exception.dart';
import 'package:siargao_trading_road/services/schedule_service.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';
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
        SnackbarHelper.showError(context, 'Failed to load schedule: ${e.toString()}');
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
        SnackbarHelper.showSuccess(context, isCurrentlyClosed ? 'Date opened' : 'Date closed');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to update date: ${e.toString()}');
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
    ).whenComplete(() {
      if (mounted) {
        setState(() {
          _selectedException = null;
        });
      }
    });
  }

  Widget _buildDayCell(BuildContext context, DateTime day, {bool isSelected = false, bool isToday = false}) {
    final isClosed = _isDateClosed(day);
    final backgroundColor = isSelected
        ? Theme.of(context).primaryColor
        : isToday
            ? Colors.blue.shade100
            : isClosed
                ? Colors.red.shade50
                : Colors.transparent;
    final textColor = isSelected
        ? Colors.white
        : isClosed
            ? Colors.red.shade700
            : Colors.black87;

    return Container(
      margin: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: isClosed && !isSelected
            ? Border.all(color: Colors.red.shade200)
            : null,
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Text(
            '${day.day}',
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (isClosed)
            Positioned(
              bottom: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white24 : Colors.red.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'Closed',
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.red.shade700,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Schedule'),
      ),
      body: SafeArea(
        child: _loading && _exceptions.isEmpty
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
                    calendarBuilders: CalendarBuilders(
                      defaultBuilder: (context, day, focusedDay) => _buildDayCell(context, day),
                      todayBuilder: (context, day, focusedDay) => _buildDayCell(
                        context,
                        day,
                        isToday: true,
                      ),
                      selectedBuilder: (context, day, focusedDay) => _buildDayCell(
                        context,
                        day,
                        isSelected: true,
                      ),
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
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: _selectedException!.isClosed ? Colors.red.shade50 : Colors.green.shade50,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: _selectedException!.isClosed ? Colors.red.shade200 : Colors.green.shade200,
                                ),
                              ),
                              child: Text(
                                _selectedException!.isClosed ? 'Closed' : 'Open',
                                style: TextStyle(
                                  color: _selectedException!.isClosed ? Colors.red.shade700 : Colors.green.shade700,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            if (!_selectedException!.isClosed && _selectedException!.openingTime != null)
                              Expanded(
                                child: Text(
                                  '${_selectedException!.openingTime} - ${_selectedException!.closingTime ?? ""}',
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
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
        SnackbarHelper.showSuccess(context, 'Schedule updated');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to update: ${e.toString()}');
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
        SnackbarHelper.showSuccess(context, 'Schedule updated');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to update: ${e.toString()}');
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
    return SafeArea(
      child: SingleChildScrollView(
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
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    _isClosed ? 'Day is closed' : 'Day is open',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: _isClosed ? Colors.red.shade700 : Colors.green.shade700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _isClosed ? 'This day is marked closed; time slots are disabled.' : 'Add opening and closing times to mark this day as open.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: Text(_isClosed ? 'Mark day open' : 'Mark day closed'),
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
      ),
    );
  }
}
