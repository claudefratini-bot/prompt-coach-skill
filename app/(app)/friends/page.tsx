import { createClient } from "@/lib/supabase/server";
import { sendFriendRequest, respondToRequest, removeFriend } from "@/app/actions/friends";

export const dynamic = "force-dynamic";

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  requester: { id: string; username: string; avatar_emoji: string | null; total_xp: number; level: number } | null;
  addressee: { id: string; username: string; avatar_emoji: string | null; total_xp: number; level: number } | null;
};

export default async function FriendsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("friendships")
    .select(`
      id, requester_id, addressee_id, status,
      requester:profiles!friendships_requester_id_fkey(id, username, avatar_emoji, total_xp, level),
      addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_emoji, total_xp, level)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const list = (rows ?? []) as unknown as FriendshipRow[];
  const accepted = list.filter((r) => r.status === "accepted");
  const incoming = list.filter((r) => r.status === "pending" && r.addressee_id === user.id);
  const outgoing = list.filter((r) => r.status === "pending" && r.requester_id === user.id);

  return (
    <div className="space-y-5 animate-slide-up">
      <h1 className="text-2xl font-black">Friends</h1>

      <form action={sendFriendRequest} className="card space-y-2">
        <div className="text-sm text-muted">Add by username</div>
        <div className="flex gap-2">
          <input name="username" placeholder="@username" required maxLength={32} />
          <button className="btn btn-primary !px-4">Send</button>
        </div>
      </form>

      {incoming.length > 0 && (
        <Section title={`Incoming (${incoming.length})`}>
          {incoming.map((r) => {
            const p = r.requester!;
            return (
              <Row key={r.id} emoji={p.avatar_emoji ?? "🦊"} name={p.username} lvl={p.level} xp={p.total_xp}>
                <form action={respondToRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="accept" value="true" />
                  <button className="btn btn-primary !py-1.5 !px-3 text-sm">Accept</button>
                </form>
                <form action={respondToRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="accept" value="false" />
                  <button className="btn btn-ghost !py-1.5 !px-3 text-sm">Reject</button>
                </form>
              </Row>
            );
          })}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="Sent">
          {outgoing.map((r) => {
            const p = r.addressee!;
            return (
              <Row key={r.id} emoji={p.avatar_emoji ?? "🦊"} name={p.username} lvl={p.level} xp={p.total_xp}>
                <span className="chip text-muted">pending</span>
                <form action={removeFriend}>
                  <input type="hidden" name="other_id" value={p.id} />
                  <button className="btn btn-ghost !py-1.5 !px-3 text-sm">Cancel</button>
                </form>
              </Row>
            );
          })}
        </Section>
      )}

      <Section title={`Crew (${accepted.length})`}>
        {accepted.length === 0 && (
          <div className="card text-center py-6 text-muted text-sm">
            No friends yet. Send a request above.
          </div>
        )}
        {accepted.map((r) => {
          const p = r.requester_id === user.id ? r.addressee! : r.requester!;
          return (
            <Row key={r.id} emoji={p.avatar_emoji ?? "🦊"} name={p.username} lvl={p.level} xp={p.total_xp}>
              <form action={removeFriend}>
                <input type="hidden" name="other_id" value={p.id} />
                <button className="btn btn-ghost !py-1.5 !px-3 text-sm">Remove</button>
              </form>
            </Row>
          );
        })}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  emoji, name, lvl, xp, children,
}: { emoji: string; name: string; lvl: number; xp: number; children: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-panel2 border border-border flex items-center justify-center text-xl">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">@{name}</div>
        <div className="text-muted text-xs">LVL {lvl} · ⚡ {xp.toLocaleString()}</div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
