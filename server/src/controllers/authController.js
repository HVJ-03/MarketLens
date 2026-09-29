import User from '../models/User.js';

/**
 * GET /api/auth/me — Get current user profile from MongoDB.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Please sign up first.',
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/sync — Create or update user in MongoDB.
 * Called automatically when a user signs in via Firebase.
 */
export const syncUser = async (req, res, next) => {
  try {
    const { uid, email } = req.user;
    const { name, photoURL } = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        firebaseUid: uid,
        email,
        name: name || '',
        photoURL: photoURL || '',
        lastLoginAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
