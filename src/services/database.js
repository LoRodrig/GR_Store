import { requireSupabase } from './supabase'

export async function listRecords(table, options = {}) {
  let query = requireSupabase().from(table).select(options.select ?? '*')
  if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? true })
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function saveRecord(table, record) {
  const { id, ...rawValues } = record
  const values = Object.fromEntries(Object.entries(rawValues).filter(([, value]) => value !== '' && value !== undefined))
  const request = id ? requireSupabase().from(table).update(values).eq('id', id) : requireSupabase().from(table).insert(values)
  // Não solicite o registro de volta: a policy RLS pode permitir gravar sem
  // permitir SELECT na linha recém-criada.
  const { error } = await request
  if (error) throw error
}

export async function removeRecord(table, id) {
  const { error } = await requireSupabase().from(table).delete().eq('id', id)
  if (error) throw error
}
