import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';
import 'package:geohash/geohash.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Location Sender',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage({Key? key}) : super(key: key);

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late String _geohash;
  late Position _position;
  late MqttServerClient _client;
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _client = MqttServerClient('10.0.2.2', 'flutter_client');
    _client.port = 5672;
    _client.logging(on: false);
    _client.keepAlivePeriod = 30;
    _client.onDisconnected = _onDisconnected;
    _connectToMqttBroker();
    _startLocationUpdates();
  }

  @override
  void dispose() {
    _timer.cancel();
    _client.disconnect();
    super.dispose();
  }

  Future<void> _connectToMqttBroker() async {
    final connMessage = MqttConnectMessage()
        .withClientIdentifier('flutter_client')
        .authenticateAs('guest', 'guest')
        .keepAliveFor(30)
        .withWillTopic('willtopic')
        .withWillMessage('Will message')
        .startClean();
    _client.connectionMessage = connMessage;
    try {
      await _client.connect();
    } catch (e) {
      print('ERROR: $e');
      _client.disconnect();
    }
  }

  void _onDisconnected() {
    print('INFO: Disconnected from broker.');
  }

  void _startLocationUpdates() {
    _timer = Timer.periodic(Duration(seconds: 1), (Timer t) async {
      try {
        _position = await Geolocator.getCurrentPosition();
        setState(() {
          _geohash = Geohash.encode(
            _position.latitude,
            _position.longitude,
          );
        });
        _sendLocationMessage();
      } catch (e) {
        print('ERROR: $e');
      }
    });
  }

  void _sendLocationMessage() {
    final topic = '/location/$_geohash';
    final message = json.encode(
        {'latitude': _position.latitude, 'longitude': _position.longitude});
    final mqttMessage = MqttClientPayloadBuilder().addString(message).payload;
    _client.publishMessage(topic, MqttQos.atLeastOnce, mqttMessage!);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Location Sender'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              'Current Geohash:',
              style: TextStyle(fontSize: 20),
            ),
            SizedBox(height: 10),
            Text(
              '$_geohash',
              style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 30),
            Text(
              'Current Location:',
              style: TextStyle(fontSize: 20),
            ),
            SizedBox(height: 10),
            Text(
              'Latitude: ${_position.latitude.toStringAsFixed(4)}, '
              'Longitude: ${_position.longitude.toStringAsFixed(4)}',
              style: TextStyle(fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}
