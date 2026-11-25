/* Konfiguracja połączenia z Supabase.
 * Klucz „publishable” jest publiczny z założenia – dostęp do danych chronią reguły RLS w bazie
 * (każda osoba widzi tylko swój postęp, a tylko członkowie rodziny mogą cokolwiek zapisać). */
window.SM_CONFIG = {
  supabaseUrl: 'https://dpvdqfzyqjkthgvxszaf.supabase.co',
  supabaseKey: 'sb_publishable_HEpES3DlVreH_yKIMUU1Bw_WfB6ad_Z',
  loginDomain: 'sternik-morski.app'
};
