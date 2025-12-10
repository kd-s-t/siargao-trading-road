export const getDownloadUrls = () => {
  const environment = 'development';
  const awsRegion = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
  const bucketName = `siargaotradingroad-mobile-builds-${environment}`;
  const s3BaseUrl = `https://${bucketName}.s3.${awsRegion}.amazonaws.com`;
  const iosFileName = process.env.NEXT_PUBLIC_IOS_FILE_NAME || 'application-0ba3caf8-40a9-4291-a0e9-407285f3c9f6.tar.gz';

  return {
    android: `${s3BaseUrl}/android/latest.apk`,
    ios: process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL || `${s3BaseUrl}/${iosFileName}`,
  };
};
