import mongoose, { Schema } from "mongoose";
import type { NewScreen, ScreenRecord, ScreenResult, ScreenStore } from "../types.js";

interface ScreenDoc {
  _id: mongoose.Types.ObjectId;
  candidateName: string;
  resumeText: string;
  jobText: string;
  result: ScreenResult;
  createdAt: Date;
}

const screenSchema = new Schema<ScreenDoc>(
  {
    candidateName: { type: String, default: "" },
    resumeText: { type: String, required: true },
    jobText: { type: String, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);

const ScreenModel = mongoose.models.Screen ?? mongoose.model<ScreenDoc>("Screen", screenSchema);

function toRecord(doc: ScreenDoc): ScreenRecord {
  return {
    id: doc._id.toString(),
    candidateName: doc.candidateName,
    resumeText: doc.resumeText,
    jobText: doc.jobText,
    result: doc.result,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createMongoStore(uri: string): Promise<ScreenStore> {
  await mongoose.connect(uri);
  return {
    async insert(screen: NewScreen): Promise<ScreenRecord> {
      const doc = await ScreenModel.create(screen);
      return toRecord(doc);
    },
    async list(limit: number): Promise<ScreenRecord[]> {
      const docs = await ScreenModel.find().sort({ createdAt: -1 }).limit(limit).exec();
      return docs.map((doc) => toRecord(doc));
    },
    async get(id: string): Promise<ScreenRecord | null> {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await ScreenModel.findById(id).exec();
      return doc ? toRecord(doc) : null;
    },
    async remove(id: string): Promise<boolean> {
      if (!mongoose.isValidObjectId(id)) return false;
      const result = await ScreenModel.findByIdAndDelete(id).exec();
      return result !== null;
    },
  };
}
