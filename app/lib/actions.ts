'use server'

import { increaseLoginCount, setCookie, signIn, signOut, signUp } from '@/app/lib/auth'
import { cookies } from 'next/headers'
import { revalidateTag } from "next/cache";
import { Event, GitHubContent, Subject, PrimitiveSubject, User, Ranking, MainPost, Message, FetchedUser } from "@/app/lib/definitions";
import { redirect } from 'next/navigation';



export async function register(currentState: unknown, formData: FormData) {
  const signup = await signUp(formData)
  if (signup.error !== '') {
    return signup.error
  }
  redirect("/login");
}

export async function authenticate(_currentState: unknown, formData: FormData) {
  const error = await signIn(formData)
  if (error) {
    return error
  }
}

export async function logout(_currentState: unknown) {
  const error = await signOut()
  if (error) {
    return error
  }
}

export async function initialize() {
  const user = await getUser();
  const updatedUser = await increaseLoginCount(user);
  await setCookie(updatedUser);
  
  redirect("/gemif/main");
}

export async function addEvent(formData: FormData) {
  const name = formData.get("name") as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string | null
  const description = formData.get('description') as string | null
  const subjectid = formData.get('subjectid') as string | null
  const primitiveid = formData.get('primitiveid') as string | null
  const scope = formData.get('scope') as string
  const event = { name, description, subjectid, date, time, primitiveid, scope }
  const filteredEvent = Object.fromEntries(Object.entries(event).filter(([_, v]) => v !== 'null'))
  
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredEvent),
  })
  if (response.ok) {
    return getEvents()
  }
  throw new Error('Failed to create event: ' + JSON.stringify(event))
}

export async function updateEvent(_currentState: unknown, formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string | null
  const description = formData.get('description') as string | null
  const subjectid = formData.get('subjectid') as string | null
  const primitiveid = formData.get('primitiveid') as string | null
  const scope = formData.get('scope') as string
  const event = { name, description, subjectid, date, time, primitiveid, scope }
  const filteredEvent = Object.fromEntries(Object.entries(event).filter(([_, v]) => v !== 'null'))

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredEvent),
  })
  if (response.ok) {
    revalidateTag('calendar')
    return 'Event updated'
  }
  throw new Error('Failed to update event: ' + JSON.stringify(filteredEvent))
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id") as string
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events/' + id, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
  })
  if (response.ok) {
    revalidateTag('calendar')
    return getEvents()
  }
  throw new Error('Failed to delete event: ' + id)
}

export async function getEvents() {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['calendar'] }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  const events: Event[] = await response.json();
  return events;
}

export async function getEvent(id: string) {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events/' + id, {
    headers: {
      Cookie: cookies().toString()
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }
  try {
    const event: Event = await response.json();
    return event;
  } catch (error) {
    return null;
  }
}

export async function getPrimitiveSubjects() {
  console.log('getPrimitiveSubjects() url: ', (process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/primitive-subjects')
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/primitive-subjects', {
    headers: {
      Cookie: cookies().toString()
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch primitive subjects');
  }
  console.log('response', response)
  const primitive_subjects: PrimitiveSubject[] = await response.json();
  return primitive_subjects;
}

export async function getSubjects() {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['subjects'] }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }
  const subjects: Subject[] = await response.json();
  return subjects;
}

export async function updateSubjects(formData: FormData) {
  const subjectsToAddRaw = formData.get("subjectsToAdd") as string;
  const subjectsToRemoveRaw = formData.get("subjectsToRemove") as string | null;
  const subjectsToAdd: PrimitiveSubject[] = JSON.parse(subjectsToAddRaw);

  // Wait for all POST requests to complete
  await Promise.all(subjectsToAdd.map(async (subject: PrimitiveSubject) => {
    const payload = { 
      name: subject.name, 
      color: subject.color, 
      bgcolor: subject.bgcolor, 
      bordercolor: subject.bordercolor, 
      year: subject.year, 
      quadri: subject.quadri, 
      archived: false, 
      score: null, 
      primitiveid: subject.id 
    };
    const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies().toString(),
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Failed to add subject: ' + subject.name);
    }
  }));

  // Handle subjects to remove if present
  if (subjectsToRemoveRaw) {
    const subjectsToRemove: Subject[] = JSON.parse(subjectsToRemoveRaw);
    await Promise.all(subjectsToRemove.map(async (subject: Subject) => {
      const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects/' + subject.id, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies().toString(),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to remove subject: ' + subject.name);
      }
    }));
  }

  revalidateTag('subjects');
  return getSubjects();
}

export async function updateSubject( formData: FormData) {
  const id = formData.get("id") as string
  const color = formData.get('color') as string
  const bgcolor = formData.get('bgcolor') as string | null
  const bordercolor = formData.get('bordercolor') as string | null
  const score = formData.get('score') as string | null
  const payload = { color, bgcolor, bordercolor, score }
  const filteredpayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== 'null'))

  console.log('filteredpayload', filteredpayload)

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredpayload),
  })
  if (response.ok) {
    revalidateTag('subjects')
    if (filteredpayload.score) {
      revalidateTag('ranking')
      return getRanking()
    }
    return getSubjects()
  }
  throw new Error('Failed to update event: ' + JSON.stringify(filteredpayload))
}

export async function getUsers() {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/users', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['users'] }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const users: FetchedUser[] = await response.json();
  return users;
}

export async function getUser(): Promise<User> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user', {
    headers: {
      Cookie: cookies().toString()
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  const user: User = await response.json();
  return user;
}


export async function updateUser(formData: FormData) {
  const name = formData.get('name') as string | null;
  const email = formData.get('email') as string | null;
  const year = formData.get('year') as string | null;
  const role = formData.get('role') as string | null;
  const color = formData.get('userColor') as string | null;

  const payload = { name, email, year, role, color }
  const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== 'null'))

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredPayload),
  })
  if (response.ok) {
    return 'User updated'
  }
  throw new Error('Failed to update user: ' + JSON.stringify(filteredPayload))
}


export async function getFiles(): Promise<{structure: GitHubContent[], error: string}> {
  const res = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/files/" , { 
    headers: {
      Cookie: cookies().toString()
    },
    cache: "no-cache" 
  });
  if (!res.ok) {
    if (res.status === 429) {
      return {structure:[], error: 'Rate limit exceeded'};
    }
    throw new Error("Failed to fetch file structure");
  }
  const structure: GitHubContent[] = await res.json();
  return { structure, error: '' };
}
export async function getMainData(): Promise<{data: GitHubContent[], error: string}> {
  const res = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-data", { 
    headers: {
      Cookie: cookies().toString()
    },
    cache: "no-cache" 
  });
  if (!res.ok) {
    if (res.status === 429) {
      return {data:[], error: 'Rate limit exceeded'};
    }
    throw new Error("Failed to fetch file structure");
  }
  const data: GitHubContent[] = await res.json();
  return { data, error: '' };
}

export async function getMainPosts() {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['main-posts'] }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch main posts');
  }
  const mainPosts: MainPost[] = await response.json();
  mainPosts.forEach((mainPost: MainPost) => {
    
  })
  return mainPosts;
}
export async function addMainPost(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get('description') as string | null
  const fileName = formData.get('fileName') as string | null
  const link = formData.get('link') as string | null
  const mainPost = { name, description, fileName, link }
  const filteredMainPost = Object.fromEntries(Object.entries(mainPost).filter(([_, v]) => v !== 'null'))
  
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredMainPost),
  })
  if (response.ok) {
    revalidateTag('main-posts')
    return getMainPosts()
  }
  throw new Error('Failed to create main post: ' + JSON.stringify(mainPost))
}
export async function updateMainPost(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get('description') as string | null
  const fileName = formData.get('fileName') as string | null
  const link = formData.get('link') as string | null
  const mainPost = { name, description, fileName, link }
  const filteredMainPost = Object.fromEntries(Object.entries(mainPost).filter(([_, v]) => v !== 'null'))

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredMainPost),
  })
  if (response.ok) {
    revalidateTag('main-posts')
    return getMainPosts()
  }
  throw new Error('Failed to update main post: ' + JSON.stringify(filteredMainPost))
}
export async function deleteMainPost(formData: FormData) {
  const id = formData.get("id") as string
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts/' + id, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
  })
  if (response.ok) {
    revalidateTag('main-posts')
    return getMainPosts()
  }
  throw new Error('Failed to delete main post: ' + id)
}



export async function getSubjectInfo(formData: FormData) {
  const id = formData.get("id") as string
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subject-info/' + id, {
    headers: {
      Cookie: cookies().toString()
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch subject info');
  }

  return response.json();
  
}



export async function archiveSubjects(formData: FormData) {
  try {
    const subjectsToArchiveRaw = formData.get("subjectsToArchive") as string;
    const subjectsToArchive: Subject[] = JSON.parse(subjectsToArchiveRaw);

    // Process archive operations in parallel
    await Promise.all(subjectsToArchive.map(async (subject: Subject) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies().toString(),
        },
        body: JSON.stringify({ archived: true })
      });
      if (!response.ok) {
        throw new Error(`Failed to archive subject: ${subject.name}`);
      }
    }));

    const subjectsToUnarchiveRaw = formData.get("subjectsToUnarchive") as string | undefined;
    
    if (subjectsToUnarchiveRaw) {
      const subjectsToUnarchive: Subject[] = JSON.parse(subjectsToUnarchiveRaw);
      
      // Process unarchive operations in parallel
      await Promise.all(subjectsToUnarchive.map(async (subject: Subject) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/subjects/${subject.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookies().toString(),
          },
          body: JSON.stringify({ archived: false })
        });
        if (!response.ok) {
          throw new Error(`Failed to unarchive subject: ${subject.name}`);
        }
      }));
    }

    revalidateTag('subjects');
    return await getSubjects();
  } catch (error) {
    console.error('Error in archiveSubjects:', error);
    throw error; // Propagate the error to the client
  }
}


export async function getRanking() {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/ranking', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['ranking'] }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch ranking');
  }
  const subjects: Subject[] = await response.json();

  const scoresMap = new Map<string, { totalScore: number; count: number }>();

  for (const { primitiveid, score } of subjects) {
    if (!score) {
      throw new Error(`Missing score for primitiveid: ${primitiveid}`);
    }

    const numericScore = Number(score);
    if (isNaN(numericScore)) {
      throw new Error(`Invalid score: ${score}`);
    }

    // Fetch or initialize entry in the map
    const entry = scoresMap.get(primitiveid);
    if (entry) {
      entry.totalScore += numericScore;
      entry.count += 1;
    } else {
      scoresMap.set(primitiveid, { totalScore: numericScore, count: 1 });
    }
  }

  // Convert the map to the final result
  const result: Ranking = Array.from(scoresMap, ([primitiveid, { totalScore, count }]) => ({
    primitiveid,
    score: totalScore / count,
  }));

  return result;

}

export async function getMessages() {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['messages'] },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  const messages: Message[] = await response.json();

  const payload = { lastseen : new Date().toISOString() }

  const responseLastSeen = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(payload),
  })
  if (!responseLastSeen.ok) {
    throw new Error('Failed to update user: ' + JSON.stringify(payload))
  }
  revalidateTag('messages/unseen')
  return messages.sort((a, b) => (new Date(b.createdat)).getTime() - (new Date(a.createdat)).getTime());
}

export async function getMessage(id: string) {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages/' + id, {
    headers: {
      Cookie: cookies().toString()
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch message');
  }
  try {
    const message: Message = await response.json();
    return message;
  } catch (error) {
    throw new Error('Failed to parse message');
  }
}

export async function deleteMessage(formData: FormData) {
  const id = formData.get("id") as string
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages/' + id, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
  })
  if (response.ok) {
    revalidateTag('messages/unseen')
    return getMessages()
  }
  throw new Error('Failed to delete message: ' + id)
}

export async function updateMessage( formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get('description') as string | null
  const year = formData.get('year') as string | null
  const scope = formData.get('scope') as string
  const message = { name, description, year, scope }
  const filteredMessage = Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== 'null'))

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredMessage),
  })
  if (response.ok) {
    revalidateTag('messages')
    return getMessages()
  }
  throw new Error('Failed to update message: ' + JSON.stringify(filteredMessage))
}

export async function addMessage(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get('description') as string | null
  const scope = formData.get('scope') as string
  const year = formData.get('year') as string | null
  const message = { name, description, year, scope }
  const filteredMessage = Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== 'null'))
  
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredMessage),
  })
  if (response.ok) {
    return getMessages()
  }
  throw new Error('Failed to create message: ' + JSON.stringify(message))
}

export async function checkUnseenMessages() {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages/unseen', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    next: { tags: ['messages/unseen'] }
  })
  const unseenMessages: Message[] = await response.json()
  if (response.ok) {
    return unseenMessages;
  }
  throw new Error('Failed to check for unseen messages')
  
}





