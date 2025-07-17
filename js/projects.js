document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");

  fetch("projects.json")
    .then((res) => res.json())
    .then((data) => {
      const project = data.find((p) => p.id === projectId);
      if (!project) return;

      // Intro section
      const introImg = document.querySelector(".intro__img");
      const introTitle = document.querySelector(
        ".section__title--intro strong"
      );
      const introSubtitle = document.querySelector(".section__subtitle--intro");
      if (introImg) introImg.src = "img/" + project.img;
      if (introTitle) introTitle.textContent = project.title;
      if (introSubtitle) introSubtitle.textContent = project.subtitle;

      // Detail image (optional)
      const detailImgContainer = document.querySelector(
        ".project-detail-image"
      );
      if (detailImgContainer && project.detail) {
        detailImgContainer.innerHTML = `
          <img src="img/${project.detail}" alt="${project.title} detail image">
        `;
      }

      // Descriptions
      const descContainer = document.querySelector(".project-descriptions");
      if (descContainer) {
        const descFields = Object.keys(project)
          .filter((key) => key.startsWith("desc"))
          .map((key) => project[key])
          .filter(Boolean);

        if (descFields.length > 0) {
          descContainer.innerHTML = descFields
            .map(
              (desc) => `<div class="desc-block">${toBulletList(desc)}</div>`
            )
            .join("");
        }
      }

      // ✅ Technologies Used grid
      const techContainer = document.querySelector(".project-technologies");
      if (techContainer && project.tech && project.tech.length > 0) {
        techContainer.innerHTML = `
  <h2 class="project-context__title">Technologies Used</h2>
  <div class="tech-grid">
    ${project.tech
      .map(
        (t) => `
        <div class="tech-item-wrapper">
          <div class="tech-tooltip">${
            t.info || "More info here"
          }<span class="tooltip-arrow"></span></div>
          <div class="tech-item holographic-card">
            <h2>${t.name || t}</h2>
          </div>
        </div>
      `
      )
      .join("")}
  </div>
`;
      }

      // Handle before/after vs intro/carousel
      const contextSection = document.querySelector(".project-context");
      const introContainer = document.querySelector(".project-intro");
      const carouselContainer = document.querySelector(".project-carousel");

      if (project.before || project.after) {
        contextSection.style.display = "block";
        let html = "";
        if (project.before) {
          html += `
            <div class="before">
              <h3>Before</h3>
              <img src="img/${project.before}" alt="Before image" class="expandable-img">
            </div>
          `;
        }
        if (project.after) {
          html += `
            <div class="after">
              <h3>After</h3>
              <img src="img/${project.after}" alt="After image" class="expandable-img">
            </div>
          `;
        }
        document.querySelector(".before-after-section").innerHTML = html;
      } else {
        contextSection.style.display = "block";
        document.querySelector(".before-after-section").style.display = "none";

        // Hide static Before/After heading and paragraphs
        document
          .querySelectorAll(
            ".project-context > h2.project-context__title, .project-context > p.project-context__description"
          )
          .forEach((el) => (el.style.display = "none"));

        if (project.intro) {
          introContainer.style.display = "block";
          introContainer.innerHTML = `
            <h2 class="project-intro__title">About this Project</h2>
            <p class="project-intro__text">${project.intro}</p>
          `;
        }
        if (project.carousel && project.carousel.length > 0) {
          carouselContainer.style.display = "block";

          const track = carouselContainer.querySelector(".carousel-track");
          track.innerHTML = project.carousel
            .map(
              (img) =>
                `<img src="img/${img}" alt="Project image" class="expandable-img">`
            )
            .join("");

          let currentIndex = 0;
          const slides = track.querySelectorAll("img");

          slides.forEach((slide) => {
            slide.style.flex = "0 0 100%";
            slide.style.objectFit = "contain";
            slide.style.height = "auto";
            slide.style.width = "100%";
          });

          function updateButtons() {
            const prevBtn = document.getElementById("prevBtn");
            const nextBtn = document.getElementById("nextBtn");
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === slides.length - 1;
          }

          function updateCarousel() {
            const containerWidth = carouselContainer.clientWidth;
            track.style.transform = `translateX(-${
              currentIndex * containerWidth
            }px)`;
            updateButtons();
          }

          document.getElementById("nextBtn").addEventListener("click", () => {
            if (currentIndex < slides.length - 1) {
              currentIndex++;
              updateCarousel();
            }
          });

          document.getElementById("prevBtn").addEventListener("click", () => {
            if (currentIndex > 0) {
              currentIndex--;
              updateCarousel();
            }
          });

          window.addEventListener("resize", updateCarousel);
          updateCarousel();
        }
      }

      // Video section
      const videoContainer = document.querySelector(".project-video");
      if (videoContainer && project.video) {
        videoContainer.innerHTML = `
          <video controls>
            <source src="img/${project.video}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        `;
      }
    })
    .catch((err) => console.error("Error loading project:", err));

  // Helper: convert bullet-point text into <ul><li>
  function toBulletList(text) {
    return (
      `<ul>` +
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => `<li>${line.replace(/^•\s*/, "")}</li>`)
        .join("") +
      `</ul>`
    );
  }

  // Lightbox Modal Logic
  const modal = document.createElement("div");
  modal.id = "lightbox-modal";
  modal.innerHTML = `
    <button class="lightbox-close">&times;</button>
    <img id="lightbox-img" src="" alt="Expanded image">
  `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector("#lightbox-img");
  const closeBtn = modal.querySelector(".lightbox-close");

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("expandable-img")) {
      modalImg.src = e.target.src;
      modal.classList.add("active");
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  // =========================
  // Tooltip logic for tech items
  // =========================
  const tooltip = document.getElementById("tech-tooltip");

  document.addEventListener("mouseover", (e) => {
    const card = e.target.closest(".tech-item");
    if (card && card.dataset.info) {
      tooltip.textContent = card.dataset.info;
      tooltip.style.display = "block";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (tooltip.style.display === "block") {
      tooltip.style.left = e.pageX + "px";
      tooltip.style.top = e.pageY - 30 + "px";
    }
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(".tech-item")) {
      tooltip.style.display = "none";
    }
  });
});
