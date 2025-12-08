import 'dart:async';
import 'package:flutter/material.dart';

void main() {
  runApp(const SwipeDemoApp());
}

class SwipeDemoApp extends StatelessWidget {
  const SwipeDemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: const SwipePager(),
      theme: ThemeData(useMaterial3: true),
    );
  }
}

class SwipePager extends StatefulWidget {
  const SwipePager({super.key});

  @override
  State<SwipePager> createState() => _SwipePagerState();
}

class _SwipePagerState extends State<SwipePager> {
  final _controller = PageController();
  final _pages = const [
    _PageConfig(color: Colors.deepPurple, title: 'Discover'),
    _PageConfig(color: Colors.teal, title: 'Favorites'),
    _PageConfig(color: Colors.orange, title: 'Profile'),
  ];
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: _pages.length,
            onPageChanged: (value) => setState(() => _index = value),
            itemBuilder: (context, position) {
              final page = _pages[position];
              return Container(
                color: page.color,
                child: SafeArea(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Text(
                          page.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Expanded(
                        child: AnimatedItemList(
                          title: page.title,
                          key: ValueKey(page.title),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 24,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_pages.length, (i) {
                final active = _index == i;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 260),
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  width: active ? 22 : 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(active ? 0.95 : 0.45),
                    borderRadius: BorderRadius.circular(12),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class AnimatedItemList extends StatefulWidget {
  const AnimatedItemList({super.key, required this.title});

  final String title;

  @override
  State<AnimatedItemList> createState() => _AnimatedItemListState();
}

class _AnimatedItemListState extends State<AnimatedItemList> {
  static const _itemCount = 8;
  final List<bool> _shown = List<bool>.filled(_itemCount, false);
  final List<Timer> _timers = [];

  @override
  void initState() {
    super.initState();
    for (var i = 0; i < _itemCount; i++) {
      final timer = Timer(Duration(milliseconds: 100 + i * 90), () {
        if (mounted) {
          setState(() => _shown[i] = true);
        }
      });
      _timers.add(timer);
    }
  }

  @override
  void dispose() {
    for (final timer in _timers) {
      timer.cancel();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _itemCount,
      itemBuilder: (context, index) {
        final visible = _shown[index];
        return AnimatedOpacity(
          duration: const Duration(milliseconds: 360),
          curve: Curves.easeOut,
          opacity: visible ? 1 : 0,
          child: AnimatedSlide(
            duration: const Duration(milliseconds: 360),
            curve: Curves.easeOut,
            offset: visible ? Offset.zero : const Offset(0, 0.12),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                child: ListTile(
                  title: Text(
                    '${widget.title} Item ${index + 1}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: const Text('Swipe horizontally for more pages'),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _PageConfig {
  final Color color;
  final String title;

  const _PageConfig({required this.color, required this.title});
}

class SwipePagerScreen extends StatelessWidget {
  const SwipePagerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SwipePager();
  }
}
