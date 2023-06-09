const functions = require("firebase-functions");

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const admin = require("firebase-admin");
admin.initializeApp();

exports.addAdminRole = functions.https.onCall(async (data, context) => {
  // get user by email and add custom claim (admin)
  return admin.auth().getUserByEmail(data.email)
      .then((user) => {
        return admin.auth().setCustomUserClaims(user.uid, {admin: true});
      }).then(() => {
        return {message: `Success! ${data.email} has been made an admin!`};
      }).catch((error) => {
        return error;
      });
});


exports.disableUser = functions.https.onCall(async (data, context) => {
  const userId = data.userId;
  try {
    await admin.auth().updateUser(userId, {disabled: true});
    return {success: true};
  } catch (error) {
    console.error(error);
    return {success: false, message: error.message};
  }
});


exports.enableUser = functions.https.onCall(async (data, context) => {
  const userId = data.userId;
  try {
    await admin.auth().updateUser(userId, {disabled: false});
    return {success: true};
  } catch (error) {
    console.error(error);
    return {success: false, message: error.message};
  }
});

