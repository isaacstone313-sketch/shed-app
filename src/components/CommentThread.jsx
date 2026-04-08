import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar } from './SessionCard'

function HighlightedBody({ body }) {
  const parts = body.split(/(@\w+)/)
  return (
    <span>
      {parts.map((part, i) =>
        /^@\w+$/.test(part)
          ? <span key={i} className="text-amber-400 font-medium">{part}</span>
          : part
      )}
    </span>
  )
}

export default function CommentThread({ sessionId, userId }) {
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [body, setBody]           = useState('')
  const [posting, setPosting]     = useState(false)
  const [replyTo, setReplyTo]     = useState(null) // { id, username }
  const inputRef = useRef(null)

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    setComments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadComments() }, [sessionId])

  async function handlePost() {
    const trimmed = body.trim()
    if (!trimmed || posting) return
    setPosting(true)
    const { error } = await supabase.from('comments').insert({
      session_id:        sessionId,
      user_id:           userId,
      body:              trimmed,
      parent_comment_id: replyTo?.id ?? null,
    })
    if (!error) {
      setBody('')
      setReplyTo(null)
      await loadComments()
    }
    setPosting(false)
  }

  async function handleDelete(commentId) {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId))
  }

  function startReply(comment) {
    setReplyTo({ id: comment.id, username: comment.profiles?.username ?? 'user' })
    setBody(`@${comment.profiles?.username ?? 'user'} `)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handlePost()
    }
  }

  const topLevel = comments.filter(c => !c.parent_comment_id)
  const repliesMap = {}
  for (const r of comments.filter(c => c.parent_comment_id)) {
    if (!repliesMap[r.parent_comment_id]) repliesMap[r.parent_comment_id] = []
    repliesMap[r.parent_comment_id].push(r)
  }

  if (loading) {
    return <div className="py-4 text-center text-slate-600 text-xs">Loading…</div>
  }

  return (
    <div className="border-t border-white/5 pt-3 pb-3 space-y-3 pr-4">
      {topLevel.length === 0 && (
        <p className="text-slate-600 text-xs text-center py-1">No comments yet.</p>
      )}

      {topLevel.map(comment => (
        <div key={comment.id} className="space-y-2">
          <CommentRow
            comment={comment}
            userId={userId}
            onReply={() => startReply(comment)}
            onDelete={() => handleDelete(comment.id)}
          />
          {(repliesMap[comment.id] ?? []).map(reply => (
            <div key={reply.id} className="ml-9 pl-0.5">
              <CommentRow
                comment={reply}
                userId={userId}
                onDelete={() => handleDelete(reply.id)}
                isReply
              />
            </div>
          ))}
        </div>
      ))}

      {/* Input */}
      <div className="flex items-end gap-2 pt-1">
        <div className="flex-1">
          {replyTo && (
            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-slate-500">
              <span>
                Replying to <span className="text-amber-400">@{replyTo.username}</span>
              </span>
              <button
                onClick={() => { setReplyTo(null); setBody('') }}
                className="text-slate-600 hover:text-slate-400 ml-1 leading-none"
              >
                ×
              </button>
            </div>
          )}
          <input
            ref={inputRef}
            className="input text-sm py-2"
            placeholder="Add a comment…"
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={1000}
          />
        </div>
        <button
          onClick={handlePost}
          disabled={!body.trim() || posting}
          className="shrink-0 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-amber-400 active:scale-95 transition"
        >
          Post
        </button>
      </div>
    </div>
  )
}

function CommentRow({ comment, userId, onReply, onDelete, isReply }) {
  const username = comment.profiles?.username ?? 'unknown'
  const isOwn = comment.user_id === userId
  const timeStr = new Date(comment.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="flex gap-2 group">
      <Avatar username={username} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-white">{username}</span>
          <span className="text-[10px] text-slate-600">{timeStr}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mt-0.5 break-words">
          <HighlightedBody body={comment.body} />
        </p>
        <div className="flex items-center gap-3 mt-1">
          {!isReply && onReply && (
            <button
              onClick={onReply}
              className="text-[11px] text-slate-600 hover:text-slate-400 transition"
            >
              Reply
            </button>
          )}
          {isOwn && (
            <button
              onClick={onDelete}
              className="text-[11px] text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
