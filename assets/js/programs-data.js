"use strict";

const StudyPrograms = (() => {
  const keys = {
    programs: "study_programs",
    organizers: "study_program_organizers",
    lecturers: "lecturers",
    courses: "courses",
  };
  const demoLecturers = [
    { id: "demo-andi", nuptk: "3172010101800001", email: "andi.pratama@kampus.ac.id" },
    { id: "demo-budi", nuptk: "3172010303820003", email: "budi.santoso@kampus.ac.id" },
    { id: "demo-siti", nuptk: "3172010202810002", email: "siti.rahma@kampus.ac.id" },
  ];
  const demoPrograms = ["Teknik Informatika", "Sistem Informasi", "Teknik Elektro", "Manajemen", "Akuntansi"];
  const byId = (records, id) => records.find(record => id !== null && String(record.id) === String(id));
  const sameId = (left, right) => left != null && right != null && String(left) === String(right);
  const params = new URLSearchParams(location.search);
  const mode = document.body.dataset.mode;
  const $ = id => document.getElementById(id);

  function read(key) {
    const source = localStorage.getItem(keys[key]);
    if (source === null) return [];
    const records = JSON.parse(source);
    if (!Array.isArray(records)) throw new Error("Format penyimpanan data tidak valid.");
    return records;
  }

  function write(key, records) {
    localStorage.setItem(keys[key], JSON.stringify(records));
  }

  function lecturers() {
    const records = read("lecturers");
    if (localStorage.getItem(keys.lecturers) === null && localStorage.getItem("siakad_programs_demo") === "1") {
      return demoLecturers;
    }
    return records;
  }

  function seed() {
    if (localStorage.getItem(keys.programs) !== null) return;
    if (localStorage.getItem(keys.lecturers) === null) {
      localStorage.setItem("siakad_programs_demo", "1");
    }
    write("programs", demoPrograms.map((name, index) => ({ id: index + 1, name })));
    if (localStorage.getItem(keys.organizers) === null && lecturers() === demoLecturers) {
      write("organizers", [
        { id: 1, study_program_id: 1, lecturer_id: "demo-andi", position: "chief", start_date: "2023-09-01", end_date: "2027-08-31" },
        { id: 2, study_program_id: 1, lecturer_id: "demo-budi", position: "secretary", start_date: "2023-09-01", end_date: "2027-08-31" },
        { id: 3, study_program_id: 1, lecturer_id: "demo-siti", position: "chief", start_date: "2019-09-01", end_date: "2023-08-31" },
      ]);
    }
  }

  function save(key, record) {
    const records = read(key);
    if (record.id == null) {
      record.id = records.reduce((max, item) => {
        const id = Number(item.id);
        return Number.isSafeInteger(id) && id >= 0 ? Math.max(id, max) : max;
      }, 0) + 1;
      records.push(record);
    } else {
      const index = records.findIndex(item => sameId(item.id, record.id));
      if (index === -1) throw new Error("Data sudah tidak tersedia.");
      records[index] = { ...records[index], ...record };
    }
    write(key, records);
  }

  function remove(key, id) {
    write(key, read(key).filter(item => !sameId(item.id, id)));
  }

  function message(element, value, error = false) {
    element.textContent = value;
    element.hidden = !value;
    element.classList.toggle("error", error);
  }

  function fail(error) {
    $("content").hidden = true;
    if ($("add")) $("add").hidden = true;
    message($("notice"), error.message || "Data tidak dapat dibuka.", true);
  }

  function showFormError(error, field) {
    message($("form-error"), error, true);
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  function bindForm(onSubmit) {
    const form = $("record-form");
    form.addEventListener("input", () => {
      message($("form-error"), "");
      form.querySelectorAll("[aria-invalid]").forEach(field => field.removeAttribute("aria-invalid"));
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      try {
        onSubmit(new FormData(form));
      } catch (error) {
        showFormError(error.message || "Data tidak dapat disimpan.");
      }
    });
  }

  function cell(row, label, content) {
    const element = row.insertCell();
    element.dataset.label = label;
    element.append(content);
    return element;
  }

  function element(tag, content, className = "") {
    const node = document.createElement(tag);
    node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function action(label, style, target) {
    const isLink = typeof target === "string";
    const node = element(isLink ? "a" : "button", label, `button small ${style}`);
    if (isLink) node.href = target;
    else {
      node.type = "button";
      node.addEventListener("click", target);
    }
    return node;
  }

  function status() {
    const messages = new Map([["created", "Data berhasil ditambahkan."], ["updated", "Perubahan berhasil disimpan."]]);
    const value = messages.get(params.get("status"));
    if (!value) return;
    message($("notice"), value);
    const url = new URL(location.href);
    url.searchParams.delete("status");
    history.replaceState(null, "", url);
  }

  function initMenu() {
    const trigger = $("menu-open");
    const closer = $("menu-close");
    const sidebar = $("sidebar");
    const backdrop = $("menu-backdrop");
    function setOpen(open) {
      sidebar.classList.toggle("open", open);
      backdrop.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      (open ? closer : trigger).focus();
    }
    trigger.addEventListener("click", () => setOpen(true));
    closer.addEventListener("click", () => setOpen(false));
    backdrop.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && sidebar.classList.contains("open")) setOpen(false);
    });
    matchMedia("(min-width: 992px)").addEventListener("change", event => {
      if (event.matches && sidebar.classList.contains("open")) setOpen(false);
    });
  }

  function init(render) {
    initMenu();
    try {
      seed();
      status();
      render();
    } catch (error) {
      fail(error);
    }
  }

  return { $, mode, params, read, lecturers, byId, sameId, save, remove, message, showFormError, bindForm, cell, element, action, init };
})();
