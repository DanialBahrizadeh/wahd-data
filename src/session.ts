import MemoryStore from "./models/store";

type Session = {
  id: string;
  "ASP.NET_SessionId": string;
  ctck: string;
  f: string;
  ft: string;
  lt: string;
  seq: string;
  su: string;
  u: string;
};

export async function getSession(
  sessionStore: MemoryStore,
  sessionId: string,
): Promise<Session | null> {
  const session: Session = {
    id: sessionId,
    "ASP.NET_SessionId": "",
    ctck: "",
    f: "",
    ft: "",
    lt: "",
    seq: "",
    su: "",
    u: "",
  };

  const result = await sessionStore.get(sessionId);

  if (!result) {
    return null;
  }

  await JSON.parse(result, (key: string, value: string) => {
    session[key as keyof Session] = value;
  });

  return session;
}

export async function setSession(
  sessionStore: MemoryStore,
  session: Session,
  sessionId: string,
) {
  await sessionStore.set(session.id, JSON.stringify(session), {
    EXP: 30 * 60,
  });
}

