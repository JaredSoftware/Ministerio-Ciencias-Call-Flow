$("#selectorClinteFinal").on("change", () => {
  const ClietnteElejido = $("#selectorClinteFinal").val();
  const saberCLiente = window.location.search.split("=");
  const nuevoEnlace = `https://apiadministrador-production.up.railway.app/generarInformeCliente?id=${saberCLiente[1]}&clienteFinal=${ClietnteElejido}`;
  //const nuevoEnlace = `http://localhost:9035/generarInformeCliente?id=${saberCLiente[1]}&clienteFinal=${ClietnteElejido}`;
  var $iframe = $("#iframe");
  if ($iframe.length) {
    $iframe.attr("src", nuevoEnlace);
    return false;
  }
  return true;
});
