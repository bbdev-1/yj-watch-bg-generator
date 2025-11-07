(function(){
  let files = [];

  const updateImagePreviews = () => {
    const previewContainer = document.getElementById('image-previews');
    previewContainer.innerHTML = '';

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.classList.add('thumbnail')
        previewContainer.appendChild(img);
        document.querySelector('input[name="images[]"]').value = '';
      };
      reader.readAsDataURL(file);
    });
  };

  const appendGeneratedImage = (imageUrl) => {
    const previewContainer = document.getElementById('generated-images');
    const img = document.createElement('img');
    img.src = imageUrl;
    img.classList.add('thumbnail')
    previewContainer.appendChild(img);
  };

  const clearInput = () => {
    document.querySelector('input[name="images[]"]').value = '';
    // document.querySelector('select[name="background_type"]').value = '';
  }

  const clearPreviews = () => {
    document.getElementById('image-previews').innerHTML = '';
    document.getElementById('generated-images').innerHTML = '';
  }

  document.querySelector('input[name="images[]"]').addEventListener('change', function(e){
    if (e.target.files.length) {
      files.push(e.target.files[0]);
      updateImagePreviews();
    }
  });

  document.querySelector('button[name="submit"]').addEventListener('click', async function(e){
    e.preventDefault();

    clearInput();
    document.querySelector('button[name="submit"]').textContent = 'Processing...';
    document.querySelector('button[name="submit"]').disabled = true;

    const backgroundType = document.querySelector('[name="background_type"]').value;

    const results = await Promise.all(files.map(async image => {
      const formData = new FormData;
      formData.append('background_type', backgroundType);
      formData.append('image', image);

      const response = await fetch('https://vincentwatch.n8n.superlazy.ai/webhook/uploads', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      console.log('json', json);

      appendGeneratedImage(json.output);
      return json;
    }));

    files = [];
    document.querySelector('button[name="submit"]').disabled = false;
    document.querySelector('button[name="submit"]').textContent = 'Submit';
  });

})();