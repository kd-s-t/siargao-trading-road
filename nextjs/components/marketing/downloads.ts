export const getDownloadUrls = () => {
  return {
    android: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || '',
    ios: process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL || '',
  };
};
