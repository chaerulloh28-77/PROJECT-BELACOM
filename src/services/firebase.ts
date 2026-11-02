// Re-export all Firebase resources and methods from src/lib/firebase.ts
export * from '../lib/firebase';
export { 
  app, 
  auth, 
  db, 
  ref, 
  onValue, 
  set, 
  update, 
  remove, 
  push, 
  get, 
  child, 
  onAuthStateChanged,
  sanitizeForFirebase,
  initAnonymousAuth,
  loginWithFirebaseBelacom,
  isFirebaseConfigured,
  subscribeToNode,
  saveNodeItem,
  updateNodeItem,
  removeNodeItem,
  setNodeCollection
} from '../lib/firebase';
