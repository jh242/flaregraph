import {v4 as uuid} from 'uuid';

const validatePost = (post) => {
    const allFields = post.title && post.username && post.content && post.timestamp;

    return allFields;
}

export const getPosts = async () => {

    const postKeys = await FLAREGRAPH_POSTS.list();
    const postPromises = [];

    for(const key of postKeys.keys) {
        postPromises.push(FLAREGRAPH_POSTS.get(key.name));
    }

    const posts = await Promise.all(postPromises);
    const responseData = posts.map((post) => (JSON.parse(post)));

    return new Response(JSON.stringify(responseData), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        status: 200,
        statusText: 'success'
    });
}

export const postPosts = async (request) => {
    const data = await request.json();
    const { title, username, content } = data;
    const timestamp = Date.now();
    const postId = uuid();

    const post = {
        postId,
        title,
        username,
        content,
        timestamp,
        likes: 0,
    };

    if(validatePost(post)) {
        await FLAREGRAPH_POSTS.put(postId, JSON.stringify(post));

        return new Response(JSON.stringify(post), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 201,
            statusText: 'success',
        });
    }

    return new Response(null, {status: 400, statusText: 'invalid post format'});
}

export const patchPost = async (request) => {
    const data = await request.json(); 
    const { postId } = request.params;

    const post = JSON.parse(await FLAREGRAPH_POSTS.get(postId));
    const updatedPost = {...post, ...data};

    await FLAREGRAPH_POSTS.put(postId, JSON.stringify(updatedPost));

    return new Response(JSON.stringify(updatedPost), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        status: 200,
        statusText: 'success',
    });
}

export const getComments = async (request) => {
    const { postId } = request.params;
    const data = (await FLAREGRAPH_POSTS.get(`${postId}_comments`)) ?? [];

    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        status: 200,
        statusText: 'success',
    });
}

export const postComment = async (request) => {
    // Request body format:
    // {
    //     username: string
    //     content: string
    // }
    const { postId } = request.params;
    const data = await request.json();

    let comments = JSON.parse(await FLAREGRAPH_POSTS.get(`${postId}_comments`));
    if(comments) {
        comments.push(data);
    } else {
        comments = [data];
    }

    await FLAREGRAPH_POSTS.put(`${postId}_comments`, JSON.stringify(comments));

    return new Response(JSON.stringify(comments), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        status: 200,
        statusText: 'success',
    });

}