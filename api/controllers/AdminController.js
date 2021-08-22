const path = require('path')
const fs = require('fs');
const { exists } = require('grunt');

/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  inicioSesion: async (peticion, respuesta) => {
    respuesta.view('pages/admin/inicio_sesion')
  },

  procesarInicioSesion: async (peticion, respuesta) => {
    let admin = await Admin.findOne({ email: peticion.body.email, contrasena: peticion.body.contrasena })
    if (admin) {
      let adminActivo = admin.activa;
      if(adminActivo == true){
        peticion.session.admin = admin
        peticion.session.cliente = undefined
        peticion.addFlash('mensaje', 'Sesión de admin iniciada')
        return respuesta.redirect("/admin/principal")
      }
      else{
        peticion.addFlash('mensaje', 'Usuario Inactivo')
        return respuesta.redirect("/admin/inicio-sesion")
      }
    }
    else {
      peticion.addFlash('mensaje', 'Email o contraseña invalidos')
      return respuesta.redirect("/admin/inicio-sesion");
    }
  },

  principal: async (peticion, respuesta) => {
    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida')
      return respuesta.redirect("/admin/inicio-sesion")
    }
    let fotos = await Foto.find().sort("id")
    respuesta.view('pages/admin/principal', { fotos })
  },
  

  listaClientes: async (peticion, respuesta) => {
    let clientes = await Cliente.find().sort("id")
    respuesta.view('pages/admin/lista_clientes', {clientes})
  },

  listaAdministradores: async (peticion, respuesta) => {
    let administradores = await Admin.find().sort("id")
    respuesta.view('pages/admin/lista_administradores',{administradores})
  },

  desactivarAdmin: async (peticion, respuesta) => {
    let idaDesactivar = peticion.params.adminId
    let idSesion = peticion.session.admin.id
    if(idaDesactivar == idSesion){
      peticion.addFlash('mensaje', 'No se puede desactivar este admin')
      return respuesta.redirect("/admin/lista-administradores")
    }else{
      await Admin.update({id: peticion.params.adminId}, {activa: false})
      peticion.addFlash('mensaje', 'Admin Desactivado')
      return respuesta.redirect("/admin/lista-administradores")
    }
  },

  activarAdmin: async (peticion, respuesta) => {
    await Admin.update({id: peticion.params.adminId}, {activa: true})
    peticion.addFlash('mensaje', 'Admin Activado')
    return respuesta.redirect("/admin/lista-administradores")
  },

  dashboard: async (peticion, respuesta) => {
    let totalAdministradores = await Admin.count()
    let totalClientes = await Cliente.count()
    let totalFotos = await Foto.count()
    let totalOrdenes = await Orden.count()
    respuesta.view('pages/admin/dashboard',{totalAdministradores,totalClientes,totalFotos,totalOrdenes})
  },



  desactivarCliente: async (peticion, respuesta) => {
    await Cliente.update({id: peticion.params.clienteId}, {activa: false})
    peticion.addFlash('mensaje', 'Cliente Desactivado')
    return respuesta.redirect("/admin/lista-clientes")
  },

  activarCliente: async (peticion, respuesta) => {
    await Cliente.update({id: peticion.params.clienteId}, {activa: true})
    peticion.addFlash('mensaje', 'Cliente Activado')
    return respuesta.redirect("/admin/lista-clientes")
  },

  cerrarSesion: async (peticion, respuesta) => {
    peticion.session.admin = undefined
    peticion.addFlash('mensaje', 'Sesión finalizada')
    return respuesta.redirect("/");
  },

  agregarFoto: async (peticion, respuesta) => {
    respuesta.view('pages/admin/agregar_foto')
  },

  procesarAgregarFoto: async (peticion, respuesta) => {
    let foto = await Foto.create({
      titulo: peticion.body.titulo,
      activa: true
    }).fetch()
    peticion.file('foto').upload({}, async (error, archivos) => {
      if (archivos && archivos[0]) {
        let upload_path = archivos[0].fd
        let ext = path.extname(upload_path)

        await fs.createReadStream(upload_path).pipe(fs.createWriteStream(path.resolve(sails.config.appPath, `assets/images/fotos/${foto.id}${ext}`)))
        await Foto.update({ id: foto.id }, { contenido: `${foto.id}${ext}` })
        peticion.addFlash('mensaje', 'Foto agregada')
        return respuesta.redirect("/admin/principal")
      }
      peticion.addFlash('mensaje', 'No hay foto seleccionada')
      return respuesta.redirect("/admin/agregar-foto")
    })
  },

  desactivarFoto: async (peticion, respuesta) => {
    await Foto.update({id: peticion.params.fotoId}, {activa: false})
    peticion.addFlash('mensaje', 'Foto desactivada')
    return respuesta.redirect("/admin/principal")
  },

  activarFoto: async (peticion, respuesta) => {
    await Foto.update({id: peticion.params.fotoId}, {activa: true})
    peticion.addFlash('mensaje', 'Foto activada')
    return respuesta.redirect("/admin/principal")
  },

};

