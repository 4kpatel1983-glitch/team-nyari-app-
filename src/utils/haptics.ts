// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';

// સામાન્ય બટન દબાવવા પર
export const hapticLight = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
};

// મોટા બટન અથવા ચેન્જ થાય ત્યારે
export const hapticMedium = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
};

// સક્સેસ (જેમ કે દાન થયું, મેમ્બર એડ થયો)
export const hapticSuccess = () => {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
};

// એરર અથવા ખોટી માહિતી
export const hapticError = () => {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
};