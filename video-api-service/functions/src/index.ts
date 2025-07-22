import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {getStorage} from "firebase-admin/storage";
import {onCall} from "firebase-functions/v2/https";

initializeApp();
const firestore = new Firestore();
const storage = getStorage();

const rawVideoBucketName = "video-process-service-raw-videos";

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoURL: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
});

export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
  });

  return {url, fileName};
});
