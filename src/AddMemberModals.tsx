import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, styles } from './AddMemberStyles';

export type Role = {
  id: number;
  name: string;
  gujarati: string;
  subtitle: string;
  responsibility: string;
  rule: string;
  note: string;
  designation: string;
};

type MemberRule = {
  no: string;
  text: string;
};

// 1. Rules Modal

export type RulesModalProps = {
  visible: boolean;
  onClose: () => void;
  rulesAccepted: boolean;
  setRulesAccepted: (val: boolean) => void;
  onAccept: () => void;
  rulesScale: Animated.Value;
  rulesOpacity: Animated.Value;
  memberRules: MemberRule[];
};

export function RulesModal({
  visible,
  onClose,
  rulesAccepted,
  setRulesAccepted,
  onAccept,
  rulesScale,
  rulesOpacity,
  memberRules,
}: RulesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View
        style={[
          styles.rulesOverlay,
          {
            backgroundColor: 'rgba(10, 35, 39, 0.72)',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.rulesCard,
            {
              opacity: rulesOpacity,
              transform: [{ scale: rulesScale }],
            },
          ]}
        >
          <View style={styles.rulesTop}>
            <View style={styles.rulesTitleIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={27}
                color={C.rama}
              />
            </View>

            <View style={styles.rulesTitleWrap}>
              <Text style={styles.rulesBrand}>
                TEAM NYARI
              </Text>

              <Text style={styles.rulesTitle}>
                સભ્યપદના નિયમો
              </Text>
            </View>
          </View>

          <View style={styles.rulesDivider} />

          <ScrollView
            style={styles.rulesScroll}
            contentContainerStyle={
              styles.rulesContent
            }
            showsVerticalScrollIndicator={false}
          >
            {memberRules.map((rule) => (
              <View
                key={rule.no}
                style={styles.ruleRow}
              >
                <View style={styles.ruleNumber}>
                  <Text
                    style={styles.ruleNumberText}
                  >
                    {rule.no}
                  </Text>
                </View>

                <View style={styles.ruleBody}>
                  <Text style={styles.ruleLabel}>
                    RULE {rule.no}
                  </Text>

                  <Text style={styles.ruleText}>
                    {rule.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={() =>
              setRulesAccepted(!rulesAccepted)
            }
            style={[
              styles.acceptRow,
              rulesAccepted &&
                styles.acceptRowActive,
            ]}
          >
            <View
              style={[
                styles.checkbox,
                rulesAccepted &&
                  styles.checkboxActive,
              ]}
            >
              {rulesAccepted && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color="#FFFFFF"
                />
              )}
            </View>

            <Text style={styles.acceptText}>
              મેં ઉપરના તમામ નિયમો વાંચ્યા છે અને
              હું તેમને સ્વીકારું છું.
            </Text>
          </Pressable>

          <Pressable
            onPress={onAccept}
            disabled={!rulesAccepted}
            style={styles.rulesContinueWrap}
          >
            <LinearGradient
              colors={
                rulesAccepted
                  ? [C.rama, C.ramaDark]
                  : ['#D8D0CA', '#C7BEB7']
              }
              style={styles.rulesContinue}
            >
              <Text
                style={styles.rulesContinueText}
              >
                નિયમો સ્વીકારું છું અને આગળ વધું
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </LinearGradient>
          </Pressable>

          <Text style={styles.rulesFooter}>
            Team Nyari • સેવા • પારદર્શિતા • શિસ્ત
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

// 2. Photo Option Modal

export type PhotoOptionModalProps = {
  visible: boolean;
  onClose: () => void;
  openCamera: () => void;
  openGallery: () => void;
};

export function PhotoOptionModal({
  visible,
  onClose,
  openCamera,
  openGallery,
}: PhotoOptionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalCenterBg}>
        <View style={styles.photoOptionCard}>
          <View style={styles.photoOptionIcon}>
            <Ionicons
              name="image-outline"
              size={27}
              color={C.rama}
            />
          </View>

          <Text style={styles.photoOptionTitle}>
            Profile Photo
          </Text>

          <Text style={styles.photoOptionSub}>
            Photo ક્યાંથી પસંદ કરવો છે?
          </Text>

          <View style={styles.photoOptionRow}>
            <Pressable
              onPress={openCamera}
              style={styles.photoChoice}
            >
              <View style={styles.photoChoiceIcon}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={C.rama}
                />
              </View>

              <Text style={styles.photoChoiceText}>
                Camera
              </Text>
            </Pressable>

            <Pressable
              onPress={openGallery}
              style={styles.photoChoice}
            >
              <View style={styles.photoChoiceIcon}>
                <Ionicons
                  name="images-outline"
                  size={24}
                  color={C.rama}
                />
              </View>

              <Text style={styles.photoChoiceText}>
                Gallery
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onClose}
            style={styles.photoCancel}
          >
            <Text style={styles.photoCancelText}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// 3. Pincode Error Modal

export type PincodeErrorModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PincodeErrorModal({
  visible,
  onClose,
}: PincodeErrorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalCenterBg}>
        <View style={styles.pinPopupCard}>
          <View style={styles.pinErrorIcon}>
            <Ionicons
              name="alert-circle"
              size={31}
              color={C.red}
            />
          </View>

          <Text style={styles.pinPopupTitle}>
            પિનકોડ મળ્યો નથી
          </Text>

          <Text style={styles.pinPopupText}>
            આ પિનકોડની વિગતો મળી શકી નથી.
            કૃપા કરીને સાચો પિનકોડ નાખો અથવા
            City, Taluka, District જાતે ભરી શકો છો.
          </Text>

          <Pressable
            onPress={onClose}
            style={styles.pinErrorButton}
          >
            <Text
              style={styles.pinPopupButtonText}
            >
              ઠીક છે
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// 4. Validation Modal

export type ValidationModalProps = {
  visible: boolean;
  onClose: () => void;
  validationMessage: string;
  popupScale: Animated.Value;
  popupOpacity: Animated.Value;
};

export function ValidationModal({
  visible,
  onClose,
  validationMessage,
  popupScale,
  popupOpacity,
}: ValidationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalCenterBg}>
        <Animated.View
          style={[
            styles.validationCard,
            {
              opacity: popupOpacity,
              transform: [{ scale: popupScale }],
            },
          ]}
        >
          <View style={styles.validationIcon}>
            <Ionicons
              name="create-outline"
              size={30}
              color={C.rama}
            />
          </View>

          <Text style={styles.validationTitle}>
            માહિતી અધૂરી છે
          </Text>

          <Text style={styles.validationSub}>
            કૃપા કરીને નીચેની માહિતી પૂર્ણ કરો
          </Text>

          <View
            style={styles.validationMessageBox}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={C.rama}
            />

            <Text style={styles.validationMessage}>
              {validationMessage}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            style={styles.validationButton}
          >
            <Text
              style={styles.validationButtonText}
            >
              ઠીક છે
            </Text>

            <Ionicons
              name="checkmark"
              size={19}
              color="#FFFFFF"
            />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// 5. Role Selection Modal

export type RoleSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  pendingRole: Role;
  selectRole: (role: Role) => void;
  roles: Role[];
  roleIcon: (
    id: number
  ) => keyof typeof Ionicons.glyphMap;
};

export function RoleSelectionModal({
  visible,
  onClose,
  pendingRole,
  selectRole,
  roles,
  roleIcon,
}: RoleSelectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.roleModal}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                Team Role પસંદ કરો
              </Text>

              <Text style={styles.modalSub}>
                તમારી જવાબદારી પ્રમાણે role પસંદ કરો
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={22}
                color={C.text}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.roleList}
          >
            {roles.map((role) => (
              <Pressable
                key={role.id}
                onPress={() =>
                  selectRole(role)
                }
                style={[
                  styles.roleOption,
                  pendingRole.id === role.id &&
                    styles.roleOptionActive,
                ]}
              >
                <View
                  style={[
                    styles.roleOptionIcon,
                    pendingRole.id === role.id &&
                      styles.roleOptionIconActive,
                  ]}
                >
                  <Ionicons
                    name={roleIcon(role.id)}
                    size={20}
                    color={
                      pendingRole.id === role.id
                        ? '#FFFFFF'
                        : C.rama
                    }
                  />
                </View>

                <View
                  style={styles.roleOptionText}
                >
                  <Text
                    style={
                      styles.roleOptionGujarati
                    }
                  >
                    {role.gujarati}
                  </Text>

                  <Text
                    style={
                      styles.roleOptionEnglish
                    }
                  >
                    {role.name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    pendingRole.id === role.id &&
                      styles.radioActive,
                  ]}
                >
                  {pendingRole.id === role.id && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color="#FFFFFF"
                    />
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// 6. Role Detail Modal

export type RoleDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  pendingRole: Role;
  confirmRole: () => void;
  onChangeRole: () => void;
  roleIcon: (
    id: number
  ) => keyof typeof Ionicons.glyphMap;
};

export function RoleDetailModal({
  visible,
  onClose,
  pendingRole,
  confirmRole,
  onChangeRole,
  roleIcon,
}: RoleDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalCenterBg}>
        <View style={styles.roleDetailCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.roleDetailIcon}>
              <Ionicons
                name={roleIcon(pendingRole.id)}
                size={30}
                color={C.rama}
              />
            </View>

            <Text
              style={styles.roleDetailTitle}
            >
              {pendingRole.gujarati}
            </Text>

            <Text
              style={styles.roleDetailEnglish}
            >
              {pendingRole.name}
            </Text>

            <View
              style={styles.roleDesignationBadge}
            >
              <Ionicons
                name="briefcase-outline"
                size={14}
                color={C.gold}
              />

              <Text
                style={
                  styles.roleDesignationText
                }
              >
                {pendingRole.designation}
              </Text>
            </View>

            <View style={styles.roleInfoBox}>
              <View style={styles.roleInfoHead}>
                <View style={styles.roleInfoIcon}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={17}
                    color={C.rama}
                  />
                </View>

                <Text
                  style={styles.roleInfoTitle}
                >
                  મુખ્ય જવાબદારી
                </Text>
              </View>

              <Text style={styles.roleInfoText}>
                {pendingRole.responsibility}
              </Text>
            </View>

            <View style={styles.roleRuleBox}>
              <View style={styles.roleInfoHead}>
                <View style={styles.roleRuleIcon}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color={C.green}
                  />
                </View>

                <Text
                  style={styles.roleRuleTitle}
                >
                  શરત & નિયમ
                </Text>
              </View>

              <Text style={styles.roleRuleText}>
                {pendingRole.rule}
              </Text>
            </View>

            <View style={styles.roleNoteRow}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={C.muted}
              />

              <Text style={styles.roleNoteText}>
                {pendingRole.note}
              </Text>
            </View>

            <Pressable
              onPress={confirmRole}
              style={styles.roleConfirmButton}
            >
              <View
                style={styles.roleConfirmIcon}
              >
                <Ionicons
                  name="checkmark"
                  size={19}
                  color={C.rama}
                />
              </View>

              <Text
                style={styles.roleConfirmText}
              >
                આ Role પસંદ કરો
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </Pressable>

            <Pressable
              onPress={onChangeRole}
              style={styles.changeRoleButton}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={17}
                color={C.muted}
              />

              <Text style={styles.changeRoleText}>
                બીજો Role પસંદ કરો
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}