import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, styles } from './AddMemberStyles';

export type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: any;
  maxLength?: number;
  editable?: boolean;
};

export function Field({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = 'default',
  maxLength,
  editable = true,
}: FieldProps) {
  return (
    <View
      style={[
        styles.fieldWrap,
        !editable && styles.fieldDisabled,
      ]}
    >
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputBox,
          !editable && styles.inputBoxDisabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={editable ? C.rama : '#9C948E'}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#AAA09A"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize="words"
          editable={editable}
          selectTextOnFocus={editable}
        />

        {!editable && (
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color="#9C948E"
          />
        )}
      </View>
    </View>
  );
}