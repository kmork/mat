package controllers

import play.api._
import play.api.mvc._

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def newMap = Action {
    Redirect(routes.Application.getMap("dsf"));
  }

  // Redirect to /hello/Bob
  def getMap(id: String) = Action {
    Ok(views.html.newMap());
  }

}