// import { createClient } from '@supabase/supabase-js'
// import dayjs from 'dayjs'

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// export default async function AdminPage() {
//   const todayStart = dayjs().startOf('day').toISOString();
//   const todayEnd = dayjs().endOf('day').toISOString();

//   const { data: sessions, error } = await supabase
//     .from('chat_sessions')
//     .select('*')
//     .gte('created_at', todayStart)
//     .lte('created_at', todayEnd)
//     .order('created_at', { ascending: false });

//   return (
//     <main className="max-w-4xl mx-auto px-4 py-10">
//       <h1 className="text-2xl font-bold mb-6">🗂️ Chat Sessions – Today</h1>

//       {error && <p className="text-red-500">Error loading sessions: {error.message}</p>}

//       {!sessions?.length && <p className="text-gray-500">No sessions today.</p>}

//       <ul className="space-y-4">
//         {sessions?.map(session => (
//           <li key={session.id} className="border p-4 rounded-lg shadow-sm bg-white">
//             <p className="font-medium">{session.patient_first_name} {session.patient_last_name}</p>
//             <p className="text-sm text-gray-500">{dayjs(session.created_at).format('h:mm A')}</p>
//             <p className="text-sm mt-1">{session.summary}</p>
//           </li>
//         ))}
//       </ul>
//     </main>
//   );
// }