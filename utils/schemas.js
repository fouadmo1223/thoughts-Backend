const Joi = require("joi");

const createUserSchema = Joi.object({
  username: Joi.string().trim().min(2).max(200).required().messages({
    "string.base": "Username must be a string",
    "string.empty": "Username is required",
    "string.min": "Username must be at least 2 characters",
    "string.max": "Username cannot exceed 200 characters",
    "any.required": "Username is required",
  }),

  email: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .email()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .required()
    .messages({
      "string.base": "Email must be a string",
      "string.empty": "Email is required",
      "string.min": "Email must be at least 3 characters",
      "any.required": "Email is required",
      "string.pattern.base":
        "Email must be a valid format (e.g., user@example.com)",
    }),

  password: Joi.string()
    .trim()
    .min(6)
    .pattern(/[0-9]/) // at least one number
    .pattern(/[!@#$%^&*(),.?":{}|<>]/) // at least one special character
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "any.required": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Password must include at least one number and one special character",
    }),

  isAdmin: Joi.boolean().default(false),
});

const loginUserSchema = Joi.object({
  email: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .email()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .required()
    .messages({
      "string.base": "Email must be a string",
      "string.empty": "Email is required",
      "string.min": "Email must be at least 3 characters",
      "any.required": "Email is required",
      "string.pattern.base":
        "Email must be a valid format (e.g., user@example.com)",
    }),

  password: Joi.string().trim().min(6).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.pattern.base":
      "Password must include at least one number and one special character",
  }),
});

const vaidateEmail = Joi.object({
  email: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .email()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .required()
    .messages({
      "string.base": "Email must be a string",
      "string.empty": "Email is required",
      "string.min": "Email must be at least 3 characters",
      "any.required": "Email is required",
      "string.pattern.base":
        "Email must be a valid format (e.g., user@example.com)",
    }),
});

const validatePassword = Joi.object({
  password: Joi.string().trim().min(6).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.pattern.base":
      "Password must include at least one number and one special character",
  }),
});

const updateUserSchema = Joi.object({
  username: Joi.string().trim().min(2).max(200).messages({
    "string.base": "Username must be a string",
    "string.min": "Username must be at least 2 characters",
    "string.max": "Username cannot exceed 200 characters",
  }),

  email: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .messages({
      "string.base": "Email must be a string",
      "string.min": "Email must be at least 3 characters",
      "string.max": "Email cannot exceed 100 characters",
      "string.pattern.base":
        "Email must be a valid format (e.g., user@example.com)",
    }),

  password: Joi.string()
    .trim()
    .min(6)
    .pattern(/[0-9]/)
    .pattern(/[!@#$%^&*(),.?":{}|<>]/)
    .messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 6 characters",
      "string.pattern.base":
        "Password must include at least one number and one special character",
    }),

  isAdmin: Joi.boolean(),

  isBlocked: Joi.boolean(),

  isAccountVerfied: Joi.boolean(),

  bio: Joi.string().trim().max(300).messages({
    "string.base": "Bio must be a string",
    "string.max": "Bio cannot exceed 300 characters",
  }),

  profileImage: Joi.object({
    url: Joi.string().uri().required(),
    publicId: Joi.string().allow(null),
  }).optional(),
}).min(1); // Ensure at least one field is present

const createPostSchema = Joi.object({
  image: Joi.object({
    url: Joi.string().uri().required().messages({
      "string.base": "Image URL must be a string",
      "string.uri": "Image URL must be a valid URI",
      "any.required": "Image URL is required",
    }),
    publicId: Joi.string().allow(null, "").messages({
      "string.base": "Public ID must be a string or null",
    }),
  }).optional(),
  title: Joi.string().trim().min(3).max(100).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title is required",
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 100 characters",
    "any.required": "Title is required",
  }),
  description: Joi.string().trim().min(10).max(500).required().messages({
    "string.base": "description must be a string",
    "string.empty": "description is required",
    "string.min": "description must be at least 10 characters",
    "string.max": "description cannot exceed 500 characters",
    "any.required": "description is required",
  }),
  category: Joi.string().trim().max(100).required().empty("").messages({
    "string.base": "Category must be a string",
    "string.empty": "Category cannot be empty",
    "string.max": "Category cannot exceed 100 characters",
    "any.required": "Category is required",
  }),
});

const updatePostSchema = Joi.object({
  image: Joi.object({
    url: Joi.string().uri().required().messages({
      "string.base": "Image URL must be a string",
      "string.uri": "Image URL must be a valid URI",
      "any.required": "Image URL is required",
    }),
    publicId: Joi.string().allow(null, "").messages({
      "string.base": "Public ID must be a string or null",
    }),
  }).optional(),

  title: Joi.string().trim().min(3).max(100).messages({
    "string.base": "Title must be a string",
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 100 characters",
  }),

  description: Joi.string().trim().min(10).max(500).messages({
    "string.base": "description must be a string",
    "string.min": "description must be at least 10 characters",
    "string.max": "description cannot exceed 500 characters",
  }),
  category: Joi.string().trim().max(100).empty("").messages({
    "string.base": "Category must be a string",
    "string.empty": "Category cannot be empty",
    "string.max": "Category cannot exceed 100 characters",
  }),
}).min(1); // At least one field required for update

const createCommentSchema = Joi.object({
  post: Joi.string().hex().length(24).required().messages({
    "string.base": "Post ID must be a string",
    "string.hex": "Post ID must be a valid ObjectId",
    "string.length": "Post ID must be 24 characters long",
    "any.required": "Post ID is required",
  }),

  text: Joi.string().trim().min(1).max(500).required().messages({
    "string.base": "Comment must be a string",
    "string.empty": "Comment is required",
    "string.min": "Comment must be at least 1 character",
    "string.max": "Comment cannot exceed 500 characters",
    "any.required": "Comment is required",
  }),
});

const updateCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).max(500).messages({
    "string.base": "Comment must be a string",
    "string.min": "Comment must be at least 1 character",
    "string.max": "Comment cannot exceed 500 characters",
  }),
}).min(1); // Require at least one field

const createCategorySchema = Joi.object({
  title: Joi.string().min(1).max(100).required().trim(),
});
const updateCategorySchema = Joi.object({
  title: Joi.string().min(1).max(100).trim(),
}).min(1); // Ensure at least one field is being updated

module.exports = {
  createUserSchema,
  updateUserSchema,
  loginUserSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  createCategorySchema,
  updateCategorySchema,
  validatePassword,
  vaidateEmail,
};
