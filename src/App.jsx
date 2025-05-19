import React, { useState, useEffect, useCallback } from 'react';

// Fungsi untuk menghasilkan ID unik sederhana
const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;

// Struktur data awal untuk item baru (tanpa ID, karena ID dibuat saat item ditambahkan)
const initialItemStructure = { name: '', price: '', quantity: '', total: 0, type: '' };

// Fungsi helper untuk format Rupiah dan parsing float
const formatRupiah = (angka) => {
  if (isNaN(angka) || angka === null) return "Rp 0";
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(angka);
};
const getFloatValue = (value, defaultValue = 0) => {
  const parsedValue = parseFloat(String(value).replace(/,/g, '')); // Hapus koma jika ada sebelum parsing
  return isNaN(parsedValue) ? defaultValue : parsedValue;
};

// Komponen ItemSection dipindahkan ke luar App
// React.memo digunakan untuk mencegah re-render yang tidak perlu jika props tidak berubah
const ItemSection = React.memo(({ title, items, onItemChange, onAddItem, onRemoveItem, type }) => {
  // console.log(`Rendering ItemSection: ${title}`); // Untuk debugging jika diperlukan
  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 p-2 border-b items-center">
          <input
            type="text"
            placeholder="Nama Barang"
            value={item.name}
            onChange={(e) => onItemChange(item.id, 'name', e.target.value, type)}
            className="md:col-span-4 mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            type="number" // Diubah ke text untuk konsistensi, validasi angka bisa manual jika perlu
            inputMode="decimal" // Membantu keyboard mobile
            placeholder="Harga Satuan"
            value={item.price} // item.price sekarang adalah string
            onChange={(e) => onItemChange(item.id, 'price', e.target.value, type)}
            className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            type="number" // Diubah ke text untuk konsistensi
            inputMode="numeric" // Membantu keyboard mobile
            placeholder="Qty"
            value={item.quantity} // item.quantity sekarang adalah string
            onChange={(e) => onItemChange(item.id, 'quantity', e.target.value, type)}
            className="md:col-span-2 mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <div className="md:col-span-3 mt-1 flex items-center text-sm text-gray-700">
            {formatRupiah(item.total)}
          </div>
          <button
            onClick={() => onRemoveItem(item.id, type)}
            className="md:col-span-1 mt-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-2 rounded text-sm"
          >
            Hapus
          </button>
        </div>
      ))}
      <button
        onClick={() => onAddItem(type)}
        className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
      >
        + Tambah {type === 'perangkat' ? 'Perangkat' : 'Material'}
      </button>
    </div>
  );
});


// Komponen utama aplikasi
const App = () => {
  // 1. Rincian Barang (HPP)
  const [perangkatItems, setPerangkatItems] = useState([]);
  const [materialItems, setMaterialItems] = useState([]);

  const [totalHppPerangkat, setTotalHppPerangkat] = useState(0);
  const [totalHppMaterial, setTotalHppMaterial] = useState(0);
  const [totalHppKeseluruhan, setTotalHppKeseluruhan] = useState(0);

  // 2. Biaya Jasa
  const [hargaJasaPerTitik, setHargaJasaPerTitik] = useState('');
  const [qtyTitik, setQtyTitik] = useState('');
  const [hargaJasaLainnya, setHargaJasaLainnya] = useState('');
  const [totalBiayaJasa, setTotalBiayaJasa] = useState(0);

  // 3. Target Keuntungan & Fee Sales
  const [persenKeuntunganPerusahaan, setPersenKeuntunganPerusahaan] = useState(0);
  const [persenFeeSales, setPersenFeeSales] = useState(0);

  // 4. Hasil Akhir (akan dihitung)
  const [totalModalBarangDanJasa, setTotalModalBarangDanJasa] = useState(0);
  const [nominalKeuntunganPerusahaan, setNominalKeuntunganPerusahaan] = useState(0);
  const [hargaJualSebelumFeeSales, setHargaJualSebelumFeeSales] = useState(0);
  const [nominalFeeSales, setNominalFeeSales] = useState(0);
  const [hargaJualAkhirKeKlien, setHargaJualAkhirKeKlien] = useState(0);
  const [totalMarginKotor, setTotalMarginKotor] = useState(0);
  const [totalMarginBersih, setTotalMarginBersih] = useState(0);

  // State untuk output penawaran (tidak digunakan di snippet ini, tapi ada di kode asli)
  // const [quotationGenerated, setQuotationGenerated] = useState(false);


  // Handler untuk item barang, dibungkus useCallback
  const handleItemChange = useCallback((id, field, value, type) => {
    const setItems = type === 'perangkat' ? setPerangkatItems : setMaterialItems;
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }; // 'value' adalah string dari e.target.value

          // Jika harga atau kuantitas berubah, update total.
          // updatedItem.price dan updatedItem.quantity adalah string.
          if (field === 'price' || field === 'quantity') {
            const priceAsNumber = getFloatValue(updatedItem.price, 0);
            const quantityAsNumber = getFloatValue(updatedItem.quantity, 0);
            updatedItem.total = priceAsNumber * quantityAsNumber;
          }
          return updatedItem;
        }
        return item;
      })
    );
  }, []); // Dependencies: state setters (stabil), jadi array kosong jika tidak ada dependensi lain

  // Fungsi tambah item, dibungkus useCallback
  const addItem = useCallback((type) => {
    const setItems = type === 'perangkat' ? setPerangkatItems : setMaterialItems;
    setItems(prevItems => [...prevItems, {
      ...initialItemStructure, // Menggunakan struktur awal
      id: generateId(),       // ID unik baru
      type: type              // Tipe item
    }]);
  }, []); // Dependencies: state setters (stabil)

  // Fungsi hapus item, dibungkus useCallback
  const removeItem = useCallback((id, type) => {
    const setItems = type === 'perangkat' ? setPerangkatItems : setMaterialItems;
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []); // Dependencies: state setters (stabil)


  // Efek untuk menghitung total HPP
  useEffect(() => {
    const newTotalHppPerangkat = perangkatItems.reduce((sum, item) => sum + getFloatValue(item.total), 0);
    setTotalHppPerangkat(newTotalHppPerangkat);
  }, [perangkatItems]);

  useEffect(() => {
    const newTotalHppMaterial = materialItems.reduce((sum, item) => sum + getFloatValue(item.total), 0);
    setTotalHppMaterial(newTotalHppMaterial);
  }, [materialItems]);

  useEffect(() => {
    setTotalHppKeseluruhan(totalHppPerangkat + totalHppMaterial);
  }, [totalHppPerangkat, totalHppMaterial]);

  // Efek untuk menghitung total biaya jasa
  useEffect(() => {
    const hargaPerTitik = getFloatValue(hargaJasaPerTitik);
    const qty = getFloatValue(qtyTitik);
    const jasaLain = getFloatValue(hargaJasaLainnya); // Ambil nilai jasa lainnya
    setTotalBiayaJasa((hargaPerTitik * qty) + jasaLain); // Tambahkan jasa lainnya ke total
  }, [hargaJasaPerTitik, qtyTitik, hargaJasaLainnya]); // Tambahkan hargaJasaLainnya ke dependencies

  // Fungsi kalkulasi utama (Hasil Akhir)
  const calculateFinalResults = useCallback(() => {
    const modal = totalHppKeseluruhan + totalBiayaJasa;
    setTotalModalBarangDanJasa(modal);

    const keuntungan = modal * (getFloatValue(persenKeuntunganPerusahaan, 0) / 100);
    setNominalKeuntunganPerusahaan(keuntungan);
    setTotalMarginBersih(keuntungan);

    const jualSblmFee = modal + keuntungan;
    setHargaJualSebelumFeeSales(jualSblmFee);

    const fee = jualSblmFee * (getFloatValue(persenFeeSales, 0) / 100);
    setNominalFeeSales(fee);

    setHargaJualAkhirKeKlien(jualSblmFee + fee);
    setTotalMarginKotor(keuntungan + fee);

  }, [totalHppKeseluruhan, totalBiayaJasa, persenKeuntunganPerusahaan, persenFeeSales]); // totalBiayaJasa sudah mencakup semua komponennya

  // Panggil kalkulasi utama setiap kali dependensi berubah
  useEffect(() => {
    calculateFinalResults();
  }, [calculateFinalResults]);


  // const handleGenerateQuotation = () => {
  //   // Implementasi untuk generate quotation (jika ada)
  //   // setQuotationGenerated(true); 
  //   console.log("Generate Quotation button clicked");
  // };


  return (
    <div className="bg-gray-100 p-4 sm:p-8 font-inter">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700">Kalkulasi Proyek</h1>
          <p className="text-gray-600">Buat dan hitung harga penjualan dengan mudah.</p>
        </header>

        {/* Bagian 1: Rincian Barang (HPP) */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Rincian Barang (HPP)</h2>
          <ItemSection title="Perangkat Keras (Devices)" items={perangkatItems} onItemChange={handleItemChange} onAddItem={addItem} onRemoveItem={removeItem} type="perangkat" />
          <div className="text-right font-semibold pr-4 mb-2">Total HPP Perangkat: {formatRupiah(totalHppPerangkat)}</div>

          <ItemSection title="Material Pendukung" items={materialItems} onItemChange={handleItemChange} onAddItem={addItem} onRemoveItem={removeItem} type="material" />
          <div className="text-right font-semibold pr-4 mb-4">Total HPP Material: {formatRupiah(totalHppMaterial)}</div>

          <div className="text-right font-bold text-lg pr-4">Total HPP Keseluruhan: {formatRupiah(totalHppKeseluruhan)}</div>
        </div>

        {/* Bagian 2: Biaya Jasa */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Biaya Jasa</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"> {/* Ubah grid-cols-3 menjadi grid-cols-4 */}
            <div>
              <label htmlFor="hargaJasaPerTitik" className="block text-sm font-medium text-gray-700 mb-1">Harga Jasa Per Titik (Rp)</label>
              <input
                type="text"
                inputMode="decimal"
                id="hargaJasaPerTitik"
                value={hargaJasaPerTitik}
                onChange={(e) => setHargaJasaPerTitik(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Harga Jasa Per Titik"
              />
            </div>
            <div>
              <label htmlFor="qtyTitik" className="block text-sm font-medium text-gray-700 mb-1">Qty Titik</label>
              <input
                type="text"
                inputMode="numeric"
                id="qtyTitik"
                value={qtyTitik}
                onChange={(e) => setQtyTitik(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Qty Titik"
              />
            </div>
            <div> {/* Input baru untuk Harga Jasa Lainnya */}
              <label htmlFor="hargaJasaLainnya" className="block text-sm font-medium text-gray-700 mb-1">Harga Jasa Lainnya (Rp)</label>
              <input
                type="text"
                inputMode="decimal"
                id="hargaJasaLainnya"
                value={hargaJasaLainnya}
                onChange={(e) => setHargaJasaLainnya(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Harga Jasa Lainnya"
              />
            </div>
            <div className="text-right font-bold text-lg">
              Total Biaya Jasa: {formatRupiah(totalBiayaJasa)}
            </div>
          </div>
        </div>

        {/* Bagian 3: Target Keuntungan & Fee Sales */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Target Keuntungan & Fee Sales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="persenKeuntunganPerusahaan" className="block text-sm font-medium text-gray-700 mb-1">Target Keuntungan Perusahaan (%)</label>
              <input
                type="number"
                inputMode="decimal"
                id="persenKeuntunganPerusahaan"
                value={persenKeuntunganPerusahaan}
                onChange={(e) => setPersenKeuntunganPerusahaan(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Target Keuntungan (%)"
              />
            </div>
            <div>
              <label htmlFor="persenFeeSales" className="block text-sm font-medium text-gray-700 mb-1">Fee Sales (%)</label>
              <input
                type="number"
                inputMode="decimal"
                id="persenFeeSales"
                value={persenFeeSales}
                onChange={(e) => setPersenFeeSales(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Fee Sales (%)"
              />
            </div>
          </div>
        </div>

        {/* Bagian 4: Hasil Akhir */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Hasil Akhir Perhitungan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Total Modal Barang dan Jasa (Rp):</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(totalModalBarangDanJasa)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Nominal Keuntungan Perusahaan (Rp):</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(nominalKeuntunganPerusahaan)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Harga Jual Sebelum Fee Sales (Rp):</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(hargaJualSebelumFeeSales)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Nominal Fee Sales (Rp):</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(nominalFeeSales)}</p>
            </div>
            <div className="md:col-span-2 p-4 bg-indigo-100 rounded-md text-center">
              <p className="text-md font-medium text-indigo-700">HARGA JUAL AKHIR KE KLIEN (Rp):</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">{formatRupiah(hargaJualAkhirKeKlien)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Total Margin Kotor (Rp):</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(totalMarginKotor)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Total Margin Bersih (Rp):</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(totalMarginBersih)}</p>
            </div>
          </div>
        </div>

        {/* Bagian 5: Tombol Generate Penawaran */}
        {/* <div className="bg-white shadow-lg rounded-lg p-6 mb-6 text-center">
          <button
            onClick={handleGenerateQuotation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
          >
            Buat Format Penawaran
          </button>
        </div> */}

        <footer className="text-center mt-8 mb-4">
          <p className="text-sm text-gray-500">&copy;
            {new Date().getFullYear()} - Kapro | Kalkulasi Proyek
            <br />
            Powered by <a href="https://www.arunix.web.id" className="text-indigo-600 hover:text-indigo-800">Arunix</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
