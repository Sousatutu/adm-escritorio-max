export type Role =
  "protocol" | "supervisor" | "manager" | "director" | "legal" | "general";
export type DocumentId =
  "request" | "budget" | "contract" | "delegation" | "contingency";
export interface DocumentRevision {
  revision: number;
  fields: Record<string, string | number | boolean>;
  attachments: { documentId: DocumentId; revision: number }[];
  reason: string;
}
export interface DocumentRecord {
  id: DocumentId;
  kind: DocumentId;
  processId: string;
  currentRevision: number;
  revisions: DocumentRevision[];
}
export interface Approval {
  id: string;
  requirementId: Role;
  signerId: string;
  authorityRole: Role;
  documentId: DocumentId;
  signedRevision: number;
  basisDigest: string;
  status: "valid" | "superseded";
}
export type GameAction =
  | { type: "TALK"; target: number }
  | { type: "DIALOGUE_CHOICE"; node: string; choice: string }
  | { type: "APPROVE"; target: number; choice: number; actorId?: string }
  | { type: "SKIP_ORDER"; target: number }
  | { type: "EVENT_PLAN" | "EVENT_REVIEW"; choice: number }
  | { type: "ATTACH_DOCUMENT"; documentId: DocumentId }
  | { type: "REVISE_REQUEST"; quantity: number; justification: string };
export interface CommandEnvelope {
  commandId: string;
  expectedRevision: number;
  action: GameAction;
}
export interface GameState {
  schemaVersion: 3;
  contentVersion: string;
  revision: number;
  seed: number;
  mode: "classic" | "normal" | "intense";
  status: "playing" | "won" | "lost";
  score: number;
  lives: number;
  turns: number;
  actionsUsed: number;
  elapsed: number;
  documents: Partial<Record<DocumentId, DocumentRecord>>;
  approvals: Approval[];
  rewards: string[];
  mistakes: {
    type: "choice" | "order" | "event" | "favoritism";
    requirement: Role;
    loss: number;
  }[];
  eventPlan: string[];
  eventIndex: number;
  pending: {
    id: string;
    phase: "decision" | "rework";
    choice: number | null;
  } | null;
  history: { id: string; choice: number }[];
  relationships: { diego: number };
  flags: { favorWarningSeen: boolean; directorAway: boolean };
  conversation: { target: number; actorId: string; node: string } | null;
  receipts: Record<string, Outcome>;
  journal: { id: number; type: string; text: string; requirement?: Role }[];
}
export interface Outcome {
  kind: string;
  message?: string;
  loss?: number;
}
export interface TransitionResult {
  state: GameState;
  result: "accepted" | "duplicate" | "rejected";
  outcome: Outcome;
  events: GameState["journal"];
}
