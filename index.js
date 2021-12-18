import { Router } from 'itty-router'
import {
    getPosts,
    patchPost,
    postPosts,
    postComment,
    getComments,
} from './controllers/posts'

// Create a new router
const router = Router()

/*
Our index route, a simple hello world.
*/
router.get('/', () => {
    return new Response('The princess is in another castle!')
})

router.get('/posts', getPosts)
router.post('/posts', postPosts)
router.post('/post/:postId', patchPost) // Would normally use patch but just avoiding preflights for the sake of time
router.get('/post/:postId/comments', getComments)
router.post('/post/:postId/comment', postComment)

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all('*', () => new Response('404, not found!', { status: 404 }))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', e => {
    e.respondWith(router.handle(e.request))
})
