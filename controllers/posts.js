import { v4 as uuid } from 'uuid'

const validatePost = post => {
    const allFields =
        post.title && post.username && post.content && post.timestamp

    return allFields
}

export const getPosts = async () => {
    const postKeys = await FLAREGRAPH_POSTS.list()
    const postPromises = []

    for (const key of postKeys.keys) {
        if (!key.name.includes('comments')) { 
            // Filter out entries for comments. Normally I would separate this into another KV namespace, though.
            postPromises.push(FLAREGRAPH_POSTS.get(key.name))
        }
    }

    try {
        const posts = await Promise.all(postPromises)
        const responseData = posts.map(post => JSON.parse(post))

        return new Response(JSON.stringify(responseData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 200,
            statusText: 'success',
        })
    } catch(error) {
        return new Response(JSON.stringify(error), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 500,
            statusText: 'KV namespace unavailable',
        })
    }
    
}

export const postPosts = async request => {
    const data = await request.json()
    const { title, username, content } = data
    const timestamp = Date.now()
    const postId = uuid()

    const post = {
        postId,
        title,
        username,
        content,
        timestamp,
        likes: 0,
    }

    if (validatePost(post)) {
        try {
            await FLAREGRAPH_POSTS.put(postId, JSON.stringify(post))

        return new Response(JSON.stringify(post), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 201,
            statusText: 'success',
        })
        } catch(error) {
            return new Response(JSON.stringify(error), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                status: 500,
                statusText: 'KV namespace unavailable',
            })
        }
    }

    return new Response(null, {
        status: 400,
        statusText: 'invalid post format',
    })
}

export const patchPost = async request => {
    const data = await request.json()
    const { postId } = request.params

    const post = JSON.parse(await FLAREGRAPH_POSTS.get(postId))
    const updatedPost = { ...post, ...data }

    try{
        await FLAREGRAPH_POSTS.put(postId, JSON.stringify(updatedPost))

        return new Response(JSON.stringify(updatedPost), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 200,
            statusText: 'success',
        })
    } catch(error) {
        return new Response(JSON.stringify(error), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 500,
            statusText: 'KV namespace unavailable',
        })
    }
    
}

export const getComments = async request => {
    const { postId } = request.params

    try {
        const data = await FLAREGRAPH_POSTS.get(`${postId}_comments`)

    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        status: 200,
        statusText: 'success',
    })
    }catch(error) {
        return new Response(JSON.stringify(error), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 500,
            statusText: 'KV namespace unavailable',
        })
    }
    
}

export const postComment = async request => {
    // Request body format:
    // {
    //     username: string
    //     content: string
    // }
    const { postId } = request.params

    try {
        let promises = [
            request.json(),
            FLAREGRAPH_POSTS.get(postId),
            FLAREGRAPH_POSTS.get(`${postId}_comments`),
        ]
        let [data, post, comments] = await Promise.all(promises)
    
        data.timestamp = Date.now()
        post = JSON.parse(post)
        comments = JSON.parse(comments)
        if (comments) {
            comments.push(data)
        } else {
            comments = [data]
        }
        post.comments = post.comments ? post.comments + 1 : 1
    
        promises = [
            FLAREGRAPH_POSTS.put(`${postId}_comments`, JSON.stringify(comments)),
            FLAREGRAPH_POSTS.put(postId, JSON.stringify(post)),
        ]
        await Promise.all(promises)
    
        return new Response(JSON.stringify(comments), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 200,
            statusText: 'success',
        })
    } catch(error) {
        return new Response(JSON.stringify(error), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 500,
            statusText: 'KV namespace unavailable',
        })
    }

    
}
