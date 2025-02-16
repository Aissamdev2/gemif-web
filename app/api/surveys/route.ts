import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'
import { Survey, SurveyInfo, SurveyOption } from '@/app/lib/definitions';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const users = (await sql`SELECT id, year FROM users`).rows;
    const subjects = (await sql`SELECT * FROM subjects WHERE userId = ${userId};`).rows;
    const primitiveIds = subjects
      .filter((subject) => !subject.archived && subject.primitiveid !== '00000000')
      .map(subject => subject.primitiveid)
      .filter((id): id is string => !!id);

    const individualSurveys = (await sql`SELECT * FROM surveys WHERE userId = ${userId};`).rows;
    
    const years = subjects.filter((subject) => !subject.archived && subject.primitiveid !== '00000000').map(subject => subject.year);

    let classSurveys = [];
    if (primitiveIds.length > 0) {
      const placeholders = primitiveIds.map((_, index) => `$${index + 1}`).join(', ');
      const query = `
        SELECT * FROM surveys 
        WHERE primitiveId IN (${placeholders}) 
        AND scope = 'admin' 
        AND userId != $${primitiveIds.length + 1};
      `;
      classSurveys = (await sql.query(query, [...primitiveIds, userId])).rows;
    }

    const otherSurveys = (await sql`SELECT * FROM surveys WHERE primitiveId = '00000000' AND userId != ${userId} AND scope = 'admin';`).rows;
    const otherSurveysYear = otherSurveys.filter((survey) => years.includes(users.find((user) => user.id === survey.userid)?.year));

    const globalSurveys = (await sql`SELECT * FROM surveys WHERE scope = 'dev' AND userId != ${userId};`).rows;
    
    const allSurveysInfo = [...individualSurveys, ...classSurveys, ...otherSurveysYear, ...globalSurveys]

    const surveys: Survey[] = await Promise.all(allSurveysInfo.map(async (surveyInfo: SurveyInfo) => {
      const options: SurveyOption[] = (await sql`SELECT * suvrvey_options WHERE surveyid = ${surveyInfo.id}`).rows as SurveyOption[]
      return { surveyInfo: surveyInfo, surveyOptions: options }
    }))


    return new Response(JSON.stringify(surveys))
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}