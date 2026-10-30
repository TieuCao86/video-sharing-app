import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';

interface InputBoxProps extends TextInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
}

export const InputBox: React.FC<InputBoxProps> = ({ onSend, placeholder = 'Leave comment...', ...rest }) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (value.trim()) {
      onSend(value);
      setValue('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={setValue}
        {...rest}
      />
      <TouchableOpacity onPress={handleSend} disabled={!value.trim()} style={styles.sendButton}>
        {/* Có thể thay bằng icon gửi */}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  sendButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});