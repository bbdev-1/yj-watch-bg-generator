(function(){
  let files = [];

  const combineImages = async (files, gridCols = 2, padding = 10)  =>{
    // Load all images
    const images = await Promise.all([...files].map(file => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
      });
    }));

    // Use the first image’s size as base
    const imgWidth = images[0].width;
    const imgHeight = images[0].height;

    // Grid calculation
    const cols = gridCols;
    const rows = Math.ceil(images.length / cols);

    const canvas = document.getElementById("resultCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = cols * imgWidth + (cols + 1) * padding;
    canvas.height = rows * imgHeight + (rows + 1) * padding;

    ctx.fillStyle = "#fff"; // background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all images in grid
    images.forEach((img, i) => {
      const x = padding + (i % cols) * (imgWidth + padding);
      const y = padding + Math.floor(i / cols) * (imgHeight + padding);
      ctx.drawImage(img, x, y, imgWidth, imgHeight);
    });

    return canvas;
  }

  const canvasToBlob = (canvas, type = 'image/png') => {
    return new Promise(resolve => canvas.toBlob(resolve, type));
  }

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

  const generate = async ({ backgroundType, image }) => {
    const formData = new FormData;
    formData.append('background_type', backgroundType);
    formData.append('image', image);

    const response = await fetch('https://vincentwatch.n8n.superlazy.ai/webhook/uploads', {
      method: 'POST',
      body: formData,
    });

    return await response.json();
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
    const makeGrid = document.querySelector('[name="make_grid"]').value === '1';

    if (makeGrid) {
      // combine selected images into a grid and generate the background
      const canvas = await combineImages(files, 2);
      const blob = await canvasToBlob(canvas);
      const json = await generate({backgroundType, image: blob});
      appendGeneratedImage(json.output);

    } else {
      // generate background for each image
      const results = await Promise.all(files.map(async image => {
        const json = await generate({backgroundType, image});
        appendGeneratedImage(json.output);
        return json;
      }));
    }

    files = [];
    document.querySelector('button[name="submit"]').disabled = false;
    document.querySelector('button[name="submit"]').textContent = 'Submit';
  });

})();