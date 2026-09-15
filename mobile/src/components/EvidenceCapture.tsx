import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { evidenceApi, inspectionApi } from '../services/api';

interface EvidenceItem {
  uri: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
}

interface Props {
  inspectionId: string;
  existingUrls?: string[];
  onEvidenceAdded?: (url: string) => void;
}

export default function EvidenceCapture({ inspectionId, existingUrls = [], onEvidenceAdded }: Props) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>(
    existingUrls.map(url => ({ uri: url, uploading: false, uploaded: true, url }))
  );

  const pickImage = async (useCamera: boolean) => {
    const permissionMethod = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionMethod();
    if (status !== 'granted') {
      Alert.alert('Permission Required', useCamera
        ? 'Camera permission is needed to take photos.'
        : 'Gallery permission is needed to select photos.');
      return;
    }

    const launchMethod = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchMethod({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      base64: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const newItem: EvidenceItem = { uri: asset.uri, uploading: true, uploaded: false };
    setEvidence(prev => [...prev, newItem]);

    try {
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      } as any);

      const uploadRes = await evidenceApi.upload(formData);
      const uploadedUrl = uploadRes.data.url;

      await inspectionApi.addEvidence(inspectionId, uploadedUrl);

      setEvidence(prev => prev.map(e =>
        e.uri === asset.uri ? { ...e, uploading: false, uploaded: true, url: uploadedUrl } : e
      ));

      onEvidenceAdded?.(uploadedUrl);
    } catch (err) {
      setEvidence(prev => prev.filter(e => e.uri !== asset.uri));
      Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
    }
  };

  const showOptions = () => {
    Alert.alert('Add Evidence', 'Choose an option', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeEvidence = (index: number) => {
    Alert.alert('Remove', 'Remove this evidence photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setEvidence(prev => prev.filter((_, i) => i !== index));
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="camera-outline" size={20} color="#3b82f6" />
        <Text style={styles.title}>Evidence Photos</Text>
        <Text style={styles.count}>{evidence.length}</Text>
      </View>

      {evidence.length > 0 && (
        <FlatList
          horizontal
          data={evidence}
          keyExtractor={(_, i) => `evidence-${i}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.thumbnail}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {item.uploading && (
                <View style={styles.uploadingOverlay}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                </View>
              )}
              {item.uploaded && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
              )}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.removeBtn}
                onPress={() => removeEvidence(index)}
              >
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity activeOpacity={0.7} style={styles.addBtn} onPress={showOptions}>
        <Ionicons name="add-circle-outline" size={22} color="#3b82f6" />
        <Text style={styles.addBtnText}>Add Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  count: { fontSize: 13, color: '#6b7280', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  list: { gap: 10, paddingVertical: 4 },
  thumbnail: { position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  image: { width: 80, height: 80, borderRadius: 8 },
  uploadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  checkBadge: { position: 'absolute', top: 4, right: 4 },
  removeBtn: { position: 'absolute', bottom: 2, right: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8 },
  addBtnText: { fontSize: 14, fontWeight: '500', color: '#3b82f6' },
});
