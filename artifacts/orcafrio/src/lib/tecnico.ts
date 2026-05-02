import { useEffect, useState } from "react";

const NOME_KEY = "orcafrio:nomeTecnico";
const ENDERECO_KEY = "orcafrio:enderecoTecnico";
const ASSINATURA_KEY = "orcafrio:assinaturaTecnico";
const REGISTRO_KEY = "orcafrio:registroTecnico";
const UPDATE_EVENT = "orcafrio:tecnico-update";

export interface TecnicoProfile {
  nome: string;
  endereco: string;
  assinatura: string;
  registroTecnico: string;
}

function readProfile(): TecnicoProfile {
  if (typeof window === "undefined") {
    return { nome: "", endereco: "", assinatura: "", registroTecnico: "" };
  }
  return {
    nome: window.localStorage.getItem(NOME_KEY) ?? "",
    endereco: window.localStorage.getItem(ENDERECO_KEY) ?? "",
    assinatura: window.localStorage.getItem(ASSINATURA_KEY) ?? "",
    registroTecnico: window.localStorage.getItem(REGISTRO_KEY) ?? "",
  };
}

export function useTecnicoProfile(): TecnicoProfile {
  const [profile, setProfile] = useState<TecnicoProfile>(readProfile);

  useEffect(() => {
    const handler = () => setProfile(readProfile());
    window.addEventListener("storage", handler);
    window.addEventListener(UPDATE_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(UPDATE_EVENT, handler);
    };
  }, []);

  return profile;
}

export function saveTecnicoProfile(updates: Partial<TecnicoProfile>): void {
  if (typeof window === "undefined") return;
  if (updates.nome !== undefined) window.localStorage.setItem(NOME_KEY, updates.nome);
  if (updates.endereco !== undefined) window.localStorage.setItem(ENDERECO_KEY, updates.endereco);
  if (updates.assinatura !== undefined) window.localStorage.setItem(ASSINATURA_KEY, updates.assinatura);
  if (updates.registroTecnico !== undefined) window.localStorage.setItem(REGISTRO_KEY, updates.registroTecnico);
  window.dispatchEvent(new Event(UPDATE_EVENT));
}
