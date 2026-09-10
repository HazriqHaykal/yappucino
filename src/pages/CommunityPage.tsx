import { useEffect, useState, type FormEvent } from "react";
import { runRecoveryNudge } from "../services/runRecoveryNudge";
import { useRecoveryStore } from "../store/useRecoveryStore";
import PageHeader from "../components/PageHeader";
import RecoverySuggestionCard from "../components/RecoverySuggestionCard";
import { ChatIcon, HeartIcon, MapPinIcon, PlusIcon, UserIcon } from "../components/icons";

type ActivityType = "study" | "walk" | "coffee" | "group_study" | "break";

// No icon or accent color per activity — hierarchy on this screen comes
// from typography, spacing, and dividers, not decoration (see the design
// brief: minimal, restrained, "premium productivity app" rather than a
// social feed).
const ACTIVITY_LABEL: Record<ActivityType, string> = {
  study: "Studying",
  walk: "Walking",
  coffee: "Having coffee",
  group_study: "Group study",
  break: "Taking a break",
};

const ACTIVITY_ORDER: ActivityType[] = ["study", "walk", "coffee", "group_study", "break"];

interface CommunityPost {
  id: string;
  activity: ActivityType;
  location: string;
  message?: string;
  timeLabel: string;
  likes: number;
  comments: string[];
  imageUrl?: string;
}

// Anonymized, approximate-location example activity — deliberately mock and
// local-only (privacy-friendly, not a real-time feed). No names, no exact
// coordinates.
const SEED_POSTS: CommunityPost[] = [
  {
    id: "seed-1",
    activity: "study",
    location: "Library — Level 3",
    timeLabel: "5 min ago",
    likes: 4,
    comments: ["Same, see you there."],
  },
  {
    id: "seed-2",
    activity: "walk",
    location: "Campus Park",
    message: "Taking a 20-minute break at the campus park.",
    timeLabel: "18 min ago",
    likes: 7,
    comments: [],
    imageUrl: "/community/walking.png",
  },
  {
    id: "seed-3",
    activity: "group_study",
    location: "Faculty of Computing",
    message: "Study group for Database Systems — anyone welcome to join.",
    timeLabel: "32 min ago",
    likes: 12,
    comments: ["What time are you starting?", "Count me in."],
    imageUrl: "/community/study-group.png",
  },
  {
    id: "seed-4",
    activity: "coffee",
    location: "Campus Café",
    message: "Needed caffeine before the 2pm lecture.",
    timeLabel: "1 hr ago",
    likes: 3,
    comments: [],
    imageUrl: "/community/coffee.png",
  },
  {
    id: "seed-5",
    activity: "break",
    location: "Engineering Courtyard",
    timeLabel: "1 hr ago",
    likes: 2,
    comments: [],
  },
];

const STATS = [
  { value: "12", label: "students studying around Faculty of Computing" },
  { value: "5", label: "students taking a break near the campus park" },
];

const emptyComposer = {
  activity: "study" as ActivityType,
  location: "",
  message: "",
  imageUrl: "",
};

export default function CommunityPage() {
  const recoverySuggestions = useRecoveryStore((state) => state.suggestions);
  const completeRecoverySuggestion = useRecoveryStore(
    (state) => state.completeRecoverySuggestion,
  );

  const [posts, setPosts] = useState<CommunityPost[]>(SEED_POSTS);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composer, setComposer] = useState(emptyComposer);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [openCommentIds, setOpenCommentIds] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(true);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);

  // Same runRecoveryNudge() flow the old Recovery tab used — a real,
  // location-aware AI suggestion — now folded into Community's "suggested
  // for you" section instead of living on its own tab.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsFetchingSuggestion(true);
      setSuggestionError(null);
      const result = await runRecoveryNudge();
      if (cancelled) return;
      setIsFetchingSuggestion(false);
      if (result) {
        setSuggestionIds(result.map((s) => s.id));
      } else {
        setSuggestionError("Couldn't find a suggestion right now, try again later.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = suggestionIds
    .map((id) => recoverySuggestions.find((s) => s.id === id))
    .filter((s): s is (typeof recoverySuggestions)[number] => s !== undefined);

  const handleShare = (e: FormEvent) => {
    e.preventDefault();
    const location = composer.location.trim();
    if (!location) return;

    const newPost: CommunityPost = {
      id: crypto.randomUUID(),
      activity: composer.activity,
      location,
      message: composer.message.trim() || undefined,
      timeLabel: "Just now",
      likes: 0,
      comments: [],
      imageUrl: composer.imageUrl.trim() || undefined,
    };

    setPosts((prev) => [newPost, ...prev]);
    setComposer(emptyComposer);
    setIsComposerOpen(false);
  };

  const toggleLike = (postId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      const wasLiked = next.has(postId);
      if (wasLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: post.likes + (wasLiked ? -1 : 1) } : post,
        ),
      );
      return next;
    });
  };

  const toggleComments = (postId: string) => {
    setOpenCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleAddComment = (postId: string) => {
    const text = (commentDrafts[postId] ?? "").trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, text] } : post,
      ),
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Community"
        description="See what other students nearby are up to, and share what you're doing right now."
        action={
          <button
            type="button"
            onClick={() => setIsComposerOpen((v) => !v)}
            className="focus-ring flex items-center gap-1.5 rounded-full bg-clay px-4 py-2 font-display text-xs font-semibold text-white transition-colors hover:bg-clay-dark sm:text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Share activity
          </button>
        }
      />

      <section className="mb-8 rounded-2xl border border-line bg-paper-card p-5 sm:p-6">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-clay-dark">
          Suggested for you
        </p>
        <p className="mt-1.5 text-sm text-ink-soft">
          A nearby spot to recharge, based on your recent workload and check-ins.
        </p>

        <div className="mt-4">
          {isFetchingSuggestion && (
            <p className="text-sm text-ink-faint">Finding a spot for you…</p>
          )}
          {!isFetchingSuggestion && suggestionError && (
            <p className="text-sm text-clay-dark">{suggestionError}</p>
          )}
          {!isFetchingSuggestion && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {suggestions.map((suggestion) => (
                <RecoverySuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onComplete={() => completeRecoverySuggestion(suggestion.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-paper-card px-5 py-4"
          >
            <p className="font-display text-3xl font-bold leading-none text-ink">{stat.value}</p>
            <p className="mt-2 text-sm leading-snug text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </div>

      {isComposerOpen && (
        <form
          onSubmit={handleShare}
          className="mb-8 rounded-2xl border border-line bg-paper-card p-5 sm:p-6"
        >
          <p className="font-display text-sm font-semibold text-ink">Share activity</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACTIVITY_ORDER.map((activity) => {
              const selected = composer.activity === activity;
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => setComposer((c) => ({ ...c, activity }))}
                  className={`focus-ring rounded-full border px-3.5 py-1.5 font-display text-xs font-semibold transition-colors ${
                    selected
                      ? "border-clay bg-clay text-white"
                      : "border-line bg-paper text-ink-soft hover:bg-line-soft"
                  }`}
                >
                  {ACTIVITY_LABEL[activity]}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label
              htmlFor="community-location"
              className="mb-1 block text-xs font-semibold text-ink-soft"
            >
              General location
            </label>
            <input
              id="community-location"
              type="text"
              value={composer.location}
              onChange={(e) => setComposer((c) => ({ ...c, location: e.target.value }))}
              placeholder="e.g. Library, Campus Park"
              className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="community-message"
              className="mb-1 block text-xs font-semibold text-ink-soft"
            >
              Message (optional)
            </label>
            <input
              id="community-message"
              type="text"
              value={composer.message}
              onChange={(e) => setComposer((c) => ({ ...c, message: e.target.value }))}
              placeholder="Say a little about what you're up to"
              maxLength={120}
              className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="community-image"
              className="mb-1 block text-xs font-semibold text-ink-soft"
            >
              Photo URL (optional)
            </label>
            <input
              id="community-image"
              type="url"
              value={composer.imageUrl}
              onChange={(e) => setComposer((c) => ({ ...c, imageUrl: e.target.value }))}
              placeholder="https://…"
              className="focus-ring w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="focus-ring rounded-full px-4 py-2 font-display text-sm font-medium text-ink-soft hover:bg-line-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!composer.location.trim()}
              className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-sm font-medium text-white hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Post
            </button>
          </div>
        </form>
      )}

      <div className="mb-10 divide-y divide-line-soft rounded-2xl border border-line bg-paper-card">
        {posts.map((post) => {
          const liked = likedIds.has(post.id);
          const commentsOpen = openCommentIds.has(post.id);

          return (
            <div key={post.id} className="px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink-faint"
                  aria-hidden="true"
                >
                  <UserIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-base font-semibold text-ink">
                      {ACTIVITY_LABEL[post.activity]}
                    </p>
                    <span className="shrink-0 text-xs text-ink-faint">{post.timeLabel}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                    <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                    {post.location}
                  </p>
                  {post.message && (
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{post.message}</p>
                  )}
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="mt-3 h-44 w-full rounded-xl object-cover sm:h-52"
                    />
                  )}

                  <div className="mt-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      aria-pressed={liked}
                      className={`focus-ring flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                        liked ? "text-clay" : "text-ink-faint hover:text-ink-soft"
                      }`}
                    >
                      <HeartIcon className="h-4 w-4" filled={liked} />
                      {post.likes > 0 ? post.likes : "Like"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      aria-expanded={commentsOpen}
                      className={`focus-ring flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                        commentsOpen ? "text-ink" : "text-ink-faint hover:text-ink-soft"
                      }`}
                    >
                      <ChatIcon className="h-4 w-4" />
                      {post.comments.length > 0 ? post.comments.length : "Comment"}
                    </button>
                  </div>

                  {commentsOpen && (
                    <div className="mt-3 space-y-2 border-t border-line-soft pt-3">
                      {post.comments.map((comment, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink-faint"
                            aria-hidden="true"
                          >
                            <UserIcon className="h-3 w-3" />
                          </span>
                          <p className="text-sm text-ink-soft">{comment}</p>
                        </div>
                      ))}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }}
                        className="flex items-center gap-2 pt-1"
                      >
                        <input
                          type="text"
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Write a comment…"
                          className="focus-ring w-full rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint"
                        />
                        <button
                          type="submit"
                          disabled={!(commentDrafts[post.id] ?? "").trim()}
                          className="focus-ring shrink-0 rounded-full bg-clay px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Post
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
