import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, differenceInDays } from 'date-fns'
import { CheckCircle2, Circle } from 'lucide-react'
import { Database } from '../types/supabase'

type Challenge = Database['public']['Tables']['challenges']['Row']
type DailyLog = Database['public']['Tables']['daily_logs']['Row']

export function Today({ userId }: { userId: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [logs, setLogs] = useState<Record<string, boolean>>({}) // challenge_id -> completed
  const [loading, setLoading] = useState(true)
  const [dayNumber, setDayNumber] = useState(1)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isPastDay = false // Since it's 'Today' screen, it's always current day.

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      // 1. Get config for start date
      const { data: config } = await supabase.from('challenge_config').select('start_date').single()
      if (config?.start_date) {
        const days = differenceInDays(new Date(), new Date(config.start_date)) + 1
        setDayNumber(days > 0 ? days : 1)
      }

      // 2. Get applicable challenges (shared + personal for this user)
      const { data: chalData } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .or(`scope.eq.shared,and(scope.eq.personal,owner_id.eq.${userId})`)
        .order('sort_order', { ascending: true })
      
      if (chalData) setChallenges(chalData)

      // 3. Get today's logs for this user
      const { data: logData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', todayStr)

      const logsMap: Record<string, boolean> = {}
      if (logData) {
        logData.forEach(log => {
          logsMap[log.challenge_id] = log.completed
        })
      }
      setLogs(logsMap)
      setLoading(false)
    }

    loadData()

    // Realtime subscription for today's logs
    const sub = supabase
      .channel('public:daily_logs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'daily_logs',
        filter: `user_id=eq.${userId}` 
      }, (payload) => {
        const newLog = payload.new as DailyLog
        if (newLog && newLog.log_date === todayStr) {
          setLogs(prev => ({ ...prev, [newLog.challenge_id]: newLog.completed }))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId, todayStr])

  const toggleHabit = async (challengeId: string) => {
    if (isPastDay) return
    const currentState = logs[challengeId] || false
    const newState = !currentState
    
    // Optimistic update
    setLogs(prev => ({ ...prev, [challengeId]: newState }))

    // Upsert to DB
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        challenge_id: challengeId,
        log_date: todayStr,
        completed: newState
      }, { onConflict: 'user_id,challenge_id,log_date' })

    if (error) {
      console.error(error)
      // Revert on error
      setLogs(prev => ({ ...prev, [challengeId]: currentState }))
    }
  }

  // Calculate stats
  const totalApplicable = challenges.length
  const completedCount = challenges.filter(c => logs[c.id]).length
  const completionPercent = totalApplicable > 0 ? Math.round((completedCount / totalApplicable) * 100) : 0
  
  const score = challenges.reduce((acc, c) => {
    if (logs[c.id]) return acc + c.points
    return acc - c.penalty
  }, 0)

  // Determine progress ring color
  let ringColor = 'var(--state-bad)'
  if (completionPercent === 100) ringColor = 'var(--state-perfect)'
  else if (completionPercent >= 75) ringColor = 'var(--state-good)'
  else if (completionPercent >= 50) ringColor = 'var(--state-okay)'

  const sharedHabits = challenges.filter(c => c.scope === 'shared')
  const personalHabits = challenges.filter(c => c.scope === 'personal')

  if (loading) return <div className="p-6 text-center text-muted mt-10">Loading Today...</div>

  return (
    <div className="flex flex-col p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-6 mt-4">
        <h2 className="text-2xl font-bold mb-1">Day {dayNumber} <span className="text-muted text-lg font-normal">of 60</span></h2>
        <p className="text-muted text-sm">{format(new Date(), 'EEEE, d MMMM')}</p>
      </div>

      {/* Progress Ring / Headline */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div 
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: '120px', height: '120px',
            background: `conic-gradient(${ringColor} ${completionPercent}%, rgba(138, 146, 178, 0.1) ${completionPercent}%)`
          }}
        >
          <div className="absolute inset-2 rounded-full flex flex-col items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
            <span className="text-3xl font-bold" style={{ color: ringColor }}>{completionPercent}%</span>
          </div>
        </div>
        <p className="text-muted mt-3 text-sm">Today's Score: <span className={score >= 0 ? 'text-green-400' : 'text-red-400'}>{score > 0 ? '+' : ''}{score} pts</span></p>
      </div>

      {/* Habit List */}
      <div className="flex flex-col gap-3">
        {sharedHabits.length > 0 && <h3 className="text-sm text-muted font-semibold mt-2 uppercase tracking-wider">Shared Habits</h3>}
        {sharedHabits.map(c => (
          <HabitRow key={c.id} challenge={c} completed={logs[c.id] || false} onToggle={() => toggleHabit(c.id)} />
        ))}

        {personalHabits.length > 0 && <h3 className="text-sm text-muted font-semibold mt-4 uppercase tracking-wider">Personal Habits</h3>}
        {personalHabits.map(c => (
          <HabitRow key={c.id} challenge={c} completed={logs[c.id] || false} onToggle={() => toggleHabit(c.id)} />
        ))}
      </div>
    </div>
  )
}

function HabitRow({ challenge, completed, onToggle }: { challenge: Challenge, completed: boolean, onToggle: () => void }) {
  return (
    <div 
      onClick={onToggle}
      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
        completed 
          ? 'bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.3)]' 
          : 'bg-[rgba(7,10,28,0.5)] border-[rgba(138,146,178,0.1)] hover:border-[rgba(138,146,178,0.3)]'
      }`}
    >
      <div className="flex items-center gap-4">
        {completed ? (
          <CheckCircle2 className="text-[var(--state-perfect)]" size={24} />
        ) : (
          <Circle className="text-muted" size={24} />
        )}
        <div className="flex flex-col">
          <span className={`font-medium ${completed ? 'text-[var(--state-perfect)]' : 'text-primary'}`}>
            {challenge.name}
          </span>
          {challenge.description && (
            <span className="text-xs text-muted mt-0.5">{challenge.description}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {challenge.tier === 1 && <span className="text-[10px] uppercase font-bold text-orange-300 bg-orange-900/30 px-2 py-0.5 rounded">T1</span>}
        <span className="text-xs font-semibold text-muted bg-white/5 px-2 py-1 rounded">+{challenge.points}</span>
      </div>
    </div>
  )
}
