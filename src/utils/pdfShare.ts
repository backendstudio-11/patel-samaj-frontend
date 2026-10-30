import { Platform, Linking, Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface ShareEventPdfParams {
  pdfData: ArrayBuffer | Uint8Array;
  eventId: string | number;
  contactNumber?: string;
  familyHeadName?: string;
  eventType?: string;
}

export interface ShareResult {
  success: boolean;
  uri?: string;
  downloadedToDevice?: boolean;
  message?: string;
  error?: string;
}

/**
 * Formats a clean, safe filename for the PDF bill
 */
export const getPdfFileName = (
  familyHeadName?: string,
  eventType?: string
): string => {
  const namePart = (familyHeadName || 'Bill').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const typePart = (eventType || 'Event').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${namePart}_${typePart}.pdf`;
};

/**
 * Normalizes contact phone number for WhatsApp deep link
 */
export const formatWhatsAppNumber = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`; // Default India country code
  }
  return digits;
};

/**
 * Checks if WhatsApp is installed and accessible on the device
 */
export const isWhatsAppAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  try {
    return await Linking.canOpenURL('whatsapp://send');
  } catch {
    return false;
  }
};

/**
 * Opens WhatsApp chat directly with the specified mobile number
 */
export const openWhatsAppDirectChat = async (
  contactNumber?: string,
  message?: string
): Promise<boolean> => {
  if (!contactNumber) return false;

  const phone = formatWhatsAppNumber(contactNumber);
  if (!phone) return false;

  const text = encodeURIComponent(message || 'Hello, please find your event bill invoice attached.');
  const nativeUrl = `whatsapp://send?phone=${phone}&text=${text}`;
  const webUrl = `https://wa.me/${phone}?text=${text}`;

  try {
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
      return true;
    }
    await Linking.openURL(webUrl);
    return true;
  } catch (error) {
    console.warn('Failed to open WhatsApp URL:', error);
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Downloads and saves the PDF file permanently to the user's device Documents folder (or browser downloads on Web)
 */
export const downloadPdfToDevice = async (
  pdfData: ArrayBuffer | Uint8Array,
  fileName: string
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([pdfData as BlobPart], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      return { success: true, uri: blobUrl };
    }

    // On Native (Android / iOS), save to user's Documents directory
    const uint8Array = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
    const docFile = new File(Paths.document, fileName);
    if (docFile.exists) {
      try {
        docFile.delete();
      } catch {
        // ignore delete error
      }
    }
    docFile.create();
    docFile.write(uint8Array);

    return { success: true, uri: docFile.uri };
  } catch (error: any) {
    console.error('Error saving PDF to device:', error);
    return { success: false, error: error?.message || 'Failed to download PDF to device' };
  }
};

/**
 * Stores PDF bytes into device cache directory and launches native share sheet for WhatsApp / messaging apps.
 * If WhatsApp / sharing is not accessible, automatically downloads/saves the PDF to the user's device.
 */
export const shareEventPdf = async ({
  pdfData,
  eventId,
  contactNumber,
  familyHeadName,
  eventType,
}: ShareEventPdfParams): Promise<ShareResult> => {
  try {
    const fileName = getPdfFileName(familyHeadName, eventType);

    // 1. Web Environment: Automatic browser download + WhatsApp web link
    if (Platform.OS === 'web') {
      const downloadResult = await downloadPdfToDevice(pdfData, fileName);

      if (contactNumber) {
        openWhatsAppDirectChat(
          contactNumber,
          `Hello ${familyHeadName || ''}, your event bill invoice (${fileName}) has been downloaded. Sharing it here with you.`
        );
      }

      return {
        success: true,
        uri: downloadResult.uri,
        downloadedToDevice: true,
        message: 'PDF bill downloaded to your computer',
      };
    }

    // 2. Native Environment (Android / iOS)
    const uint8Array = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);

    // Save to cache directory first (auto-managed by OS)
    const cacheFile = new File(Paths.cache, fileName);
    if (cacheFile.exists) {
      try {
        cacheFile.delete();
      } catch {
        // ignore delete failure
      }
    }
    cacheFile.create();
    cacheFile.write(uint8Array);

    const isShareAvailable = await Sharing.isAvailableAsync();

    if (isShareAvailable) {
      try {
        await Sharing.shareAsync(cacheFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: contactNumber
            ? `Share Bill PDF to ${contactNumber}`
            : 'Share Event Bill PDF',
          UTI: 'com.adobe.pdf',
        });
        return { success: true, uri: cacheFile.uri };
      } catch (shareErr) {
        console.warn('Share sheet was dismissed or failed, falling back to device download:', shareErr);
        // Fallback: Download/save to user's device documents
        const saveResult = await downloadPdfToDevice(uint8Array, fileName);
        return {
          success: true,
          uri: saveResult.uri,
          downloadedToDevice: true,
          message: 'WhatsApp not accessible. Bill PDF saved to device documents.',
        };
      }
    } else {
      // Sharing is not available on this device: save directly to documents
      const saveResult = await downloadPdfToDevice(uint8Array, fileName);
      if (contactNumber) {
        await openWhatsAppDirectChat(contactNumber);
      }
      return {
        success: true,
        uri: saveResult.uri,
        downloadedToDevice: true,
        message: 'Sharing unavailable. Bill PDF saved to device documents.',
      };
    }
  } catch (error: any) {
    console.error('Error in shareEventPdf:', error);
    // Ultimate fallback attempt to save to device
    try {
      const fileName = getPdfFileName(familyHeadName, eventType);
      const saveResult = await downloadPdfToDevice(pdfData, fileName);
      if (saveResult.success) {
        return {
          success: true,
          uri: saveResult.uri,
          downloadedToDevice: true,
          message: 'Bill PDF saved to device documents.',
        };
      }
    } catch {}

    return { success: false, error: error?.message || 'Failed to share or download PDF' };
  }
};
