// Import the Express framework for building HTTP servers
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

// Get all bootcamps
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ success: true, msg: "Show all bootcamps." });
});

// Get a bootcamp with a specific id
router.get("/:id", (req: Request, res: Response) => {
  res
    .status(200)
    .json({
      success: true,
      msg: `Bootcamp with id = ${req.params.id} successfully retrieved.`,
    });
});

// Add a bootcamp
router.post("/", (req: Request, res: Response) => {
  res.status(200).json({ success: true, msg: "Bootcamp successfully added." });
});

// Replace a bootcamp
router.put("/:id", (req: Request, res: Response) => {
  res
    .status(200)
    .json({
      success: true,
      msg: `Bootcamp with id = ${req.params.id} successfully replaced.`,
    });
});

// Replace a bootcamp
router.patch("/:id", (req: Request, res: Response) => {
  res
    .status(200)
    .json({
      success: true,
      msg: `Bootcamp with id = ${req.params.id} successfully modified.`,
    });
});

// Delete a bootcamp
router.delete("/:id", (req: Request, res: Response) => {
  res
    .status(200)
    .json({
      success: true,
      msg: `Bootcamp with id = ${req.params.id} successfully deleted.`,
    });
});

export default router;