import SmsAndroid from "react-native-get-sms-android";
import { PermissionsAndroid, Platform } from "react-native";

export async function requestSmsPermission() {
  if (Platform.OS !== "android") return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "SMS Permission",
        message: "This app needs access to your SMS to track expenses.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

export interface SmsMessage {
  _id: number;
  address: string;
  body: string;
  date: number;
  date_sent: number;
}

export function fetchSms(minDate: number = 0): Promise<SmsMessage[]> {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== "android") {
      resolve([]);
      return;
    }

    const filter = {
      box: "inbox",
      minDate: minDate,
      indexFrom: 0,
      maxCount: 200,
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => {
        console.error("Failed to fetch SMS", fail);
        reject(fail);
      },
      (count: number, smsList: string) => {
        try {
          const arr = JSON.parse(smsList);
          resolve(arr);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}
