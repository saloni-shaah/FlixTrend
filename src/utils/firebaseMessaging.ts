
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebaseClient";

export const requestForToken = async () => {
  const messaging = getMessaging(app);
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getToken(messaging, { vapidKey: "BDzXeTQuuf5a_znsOPHUZlegNYRO4JpXd1Zua5tsN3ucWs3MnGD_x62aaKt7AFdyR4u3CCuZemkPilt-HdTSZpk" });
    console.log("Token: ", token);
    return token;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      resolve(payload);
    });
  });
