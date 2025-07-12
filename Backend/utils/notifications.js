const Notification = require('../models/Notification');

const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const notifyAnswerReceived = async (questionAuthor, answerAuthor, questionId, answerId) => {
  if (questionAuthor.toString() === answerAuthor.toString()) return;

  await createNotification({
    type: 'answer',
    content: `Your question received a new answer`,
    user: questionAuthor,
    from: answerAuthor,
    linkTo: {
      question: questionId,
      answer: answerId
    }
  });
};

const notifyAnswerAccepted = async (answerAuthor, questionAuthor, questionId, answerId) => {
  if (questionAuthor.toString() === answerAuthor.toString()) return;

  await createNotification({
    type: 'accepted_answer',
    content: `Your answer was accepted`,
    user: answerAuthor,
    from: questionAuthor,
    linkTo: {
      question: questionId,
      answer: answerId
    }
  });
};

const notifyMention = async (mentionedUser, mentioner, content, questionId, answerId) => {
  if (mentionedUser.toString() === mentioner.toString()) return;

  await createNotification({
    type: 'mention',
    content: `You were mentioned: "${content.substring(0, 100)}..."`,
    user: mentionedUser,
    from: mentioner,
    linkTo: {
      question: questionId,
      answer: answerId
    }
  });
};

module.exports = {
  createNotification,
  notifyAnswerReceived,
  notifyAnswerAccepted,
  notifyMention
};