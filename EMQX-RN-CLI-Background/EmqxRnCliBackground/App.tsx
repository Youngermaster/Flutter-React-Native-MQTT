import React from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import LocationDisplay from './LocationDisplay';

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#333' : '#FFF',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <LocationDisplay />
    </SafeAreaView>
  );
};

export default App;
