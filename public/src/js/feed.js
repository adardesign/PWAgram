const shareImageButton = document.querySelector('#share-image-button')
const createPostArea = document.querySelector('#create-post')
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn'
)
const sharedMomentsArea = document.querySelector('#shared-moments')
const form = document.forms.create_post

function openCreatePostModal() {
  createPostArea.style.display = 'block'
  if (deferredPrompt) {
    deferredPrompt.prompt()

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome)

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation')
      } else {
        console.log('User added to home screen')
      }
    })

    deferredPrompt = null
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none'
}

shareImageButton.addEventListener('click', openCreatePostModal)

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal)

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div')
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp'
  var cardTitle = document.createElement('div')
  cardTitle.className = 'mdl-card__title'
  cardTitle.style.backgroundImage = 'url(' + data.image + ')'
  cardTitle.style.backgroundSize = 'cover'
  cardTitle.style.height = '180px'
  cardWrapper.appendChild(cardTitle)
  var cardTitleTextElement = document.createElement('h2')
  cardTitleTextElement.style.color = 'white'
  cardTitleTextElement.className = 'mdl-card__title-text'
  cardTitleTextElement.textContent = data.title
  cardTitle.appendChild(cardTitleTextElement)
  var cardSupportingText = document.createElement('div')
  cardSupportingText.className = 'mdl-card__supporting-text'
  cardSupportingText.textContent = data.location
  cardSupportingText.style.textAlign = 'center'
  cardWrapper.appendChild(cardSupportingText)
  componentHandler.upgradeElement(cardWrapper)
  sharedMomentsArea.appendChild(cardWrapper)
}

;(async () => {
  try {
    const data = await (await fetch(
      'https://pwa-gram-358d7.firebaseio.com/posts.json'
    )).json()
    console.log('from web', data)
    clearCards()
    for (let post of Object.values(data)) {
      createCard(post)
    }
  } catch (e) {
    console.log('NO WORRIES 👌', e)
    const data = await readAllData('posts')
    console.log('From cache', data)
    clearCards()
    data.forEach(post => createCard(post))
  }
})()

async function sendData(e) {
  const res = await fetch(
    'https://us-central1-pwa-gram-358d7.cloudfunctions.net/storePostData',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        id: new Date().toISOString(),
        title: form.title.value,
        location: form.location.value,
        image:
          'https://firebasestorage.googleapis.com/v0/b/pwa-gram-358d7.appspot.com/o/IMG_2970.JPG?alt=media&token=b0f77615-c129-46c0-9b13-5cecc0214b33',
      }),
    }
  )
  console.log('Send data', await res.json())
}

form.addEventListener('submit', async e => {
  e.preventDefault()
  if (!form.title.value.trim() || !form.location.value.trim()) return

  closeCreatePostModal()

  if ('SyncManager' in window) {
    const sw = await navigator.serviceWorker.ready
    const newPost = {
      id: new Date().toISOString(),
      title: form.title.value,
      location: form.location.value,
    }
    try {
      await writeData('sync-posts', newPost)
      sw.sync.register('sync-new-posts')
      const snackbar = document.querySelector('#confirmation-toast')
      const data = { message: 'Your post was saved for syncing' }
      snackbar.MaterialSnackbar.showSnackbar(data)
    } catch (e) {
      console.log('Error writing data ❌', e)
    }
  } else {
    sendData()
  }
})
